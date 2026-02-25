import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Proposal, ProposalFormData } from '../types';

function generateSlug(clientName: string, projectName: string): string {
  const year = new Date().getFullYear();
  const raw = `hiro-${clientName}-${projectName}-${year}`;
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function useProposals() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapProposal);
    },
  });

  const createProposal = useMutation({
    mutationFn: async (form: ProposalFormData) => {
      // Upload client logo
      let clientLogoUrl: string | null = null;
      if (form.client_logo_file) {
        const ext = form.client_logo_file.name.split('.').pop();
        const path = `logos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: logoError } = await supabase.storage
          .from('proposal-moodboard')
          .upload(path, form.client_logo_file);
        if (logoError) throw logoError;
        const { data: logoUrlData } = supabase.storage
          .from('proposal-moodboard')
          .getPublicUrl(path);
        clientLogoUrl = logoUrlData.publicUrl;
      }

      // Upload moodboard images
      const imageUrls: string[] = [];
      for (const file of form.moodboard_files) {
        const ext = file.name.split('.').pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('proposal-moodboard')
          .upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from('proposal-moodboard')
          .getPublicUrl(path);
        imageUrls.push(urlData.publicUrl);
      }

      // Generate slug with uniqueness check
      let slug = generateSlug(form.client_name, form.project_name);
      const { data: existing } = await supabase
        .from('orcamentos')
        .select('slug')
        .eq('slug', slug)
        .maybeSingle();
      if (existing) {
        slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
      }

      const baseValue = form.base_value || 0;
      const discountPct = form.discount_pct || 0;
      const finalValue = baseValue * (1 - discountPct / 100);

      const { data: userData } = await supabase.auth.getUser();

      const scopePre = form.scope_pre_production.filter(s => s.item.trim());
      const scopeProd = form.scope_production.filter(s => s.item.trim());
      const scopePost = form.scope_post_production.filter(s => s.item.trim());
      const timeline = form.timeline.filter(t => t.week.trim() || t.description.trim());

      const { data, error } = await supabase
        .from('orcamentos')
        .insert({
          slug,
          client_name: form.client_name.trim(),
          project_name: form.project_name.trim(),
          project_number: form.project_number.trim() || null,
          client_responsible: form.client_responsible.trim() || null,
          client_logo: clientLogoUrl,
          validity_date: form.validity_date?.toISOString().split('T')[0],
          briefing: form.briefing.trim() || null,
          video_url: form.video_url.trim() || null,
          moodboard_images: imageUrls as any,
          scope_pre_production: scopePre as any,
          scope_production: scopeProd as any,
          scope_post_production: scopePost as any,
          timeline: timeline as any,
          base_value: baseValue,
          discount_pct: discountPct,
          final_value: finalValue,
          payment_terms: form.payment_terms.trim(),
          created_by: userData?.user?.id || null,
          status: 'draft',
        } as any)
        .select()
        .single();

      if (error) throw error;
      return mapProposal(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposta criada com sucesso!');
    },
    onError: (err: Error) => {
      toast.error('Erro ao criar proposta: ' + err.message);
    },
  });

  const deleteProposal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('orcamentos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposta excluída');
    },
  });

  return { ...query, createProposal, deleteProposal };
}

function mapProposal(row: any): Proposal {
  return {
    ...row,
    client_logo: row.client_logo || null,
    moodboard_images: Array.isArray(row.moodboard_images) ? row.moodboard_images : [],
    scope_pre_production: Array.isArray(row.scope_pre_production) ? row.scope_pre_production : [],
    scope_production: Array.isArray(row.scope_production) ? row.scope_production : [],
    scope_post_production: Array.isArray(row.scope_post_production) ? row.scope_post_production : [],
    timeline: Array.isArray(row.timeline) ? row.timeline : [],
  };
}
