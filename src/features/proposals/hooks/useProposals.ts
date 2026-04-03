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

      // Filter V2 data
      const diagnosticoDores = form.diagnostico_dores.filter(d => d.title.trim() || d.desc.trim());
      const entregaveis = form.entregaveis.filter((e: any) => e.output?.trim());
      const cases = form.cases.filter(c => c.vimeoId?.trim() || c.titulo?.trim());
      const paymentOptions = form.payment_options.filter(p => p.titulo.trim());

      const { data, error } = await supabase
        .from('orcamentos')
        .insert({
          slug,
          client_name: form.client_name.trim(),
          project_name: form.project_name.trim(),
          client_responsible: form.client_responsible.trim() || null,
          
          validity_date: form.validity_date?.toISOString().split('T')[0],
          base_value: baseValue,
          discount_pct: discountPct,
          final_value: finalValue,
          payment_terms: form.payment_terms.trim(),
          created_by: userData?.user?.id || null,
          status: 'draft',
          objetivo: form.objetivo.trim() || null,
          diagnostico_dores: diagnosticoDores as any,
          list_price: form.list_price || null,
          payment_options: paymentOptions as any,
          testimonial_name: form.testimonial_name.trim() || null,
          testimonial_role: form.testimonial_role.trim() || null,
          testimonial_text: form.testimonial_text.trim() || null,
          testimonial_image: form.testimonial_image.trim() || null,
          entregaveis: entregaveis as any,
          cases: cases as any,
          whatsapp_number: form.whatsapp_number.trim() || null,
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
    diagnostico_dores: Array.isArray(row.diagnostico_dores) ? row.diagnostico_dores : [],
    payment_options: Array.isArray(row.payment_options) ? row.payment_options : [],
    entregaveis: Array.isArray(row.entregaveis) ? row.entregaveis : [],
    cases: Array.isArray(row.cases) ? row.cases : [],
  };
}
