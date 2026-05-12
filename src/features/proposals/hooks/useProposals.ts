import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Proposal, ProposalFormData, ProposalCase } from '../types';
import { formatMoney } from '@/ds/lib/money';

export function generateSlug(clientName: string, projectName: string, projectNumber?: string | null, version?: number): string {
  const v = version || 1;
  const parts = [projectNumber, clientName, projectName].filter(Boolean).join('-');
  const base = parts
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base}-v${v}`;
}

export function useProposals() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('is_latest_version', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapProposal);
    },
  });

  const createProposal = useMutation({
    mutationFn: async (form: ProposalFormData) => {
      // Generate slug with uniqueness check
      let slug = generateSlug(form.client_name, form.project_name, form.project_number, 1);
      const { data: existing } = await supabase
        .from('orcamentos')
        .select('slug')
        .eq('slug', slug)
        .maybeSingle();
      if (existing) {
        slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
      }

      const listPrice = form.list_price || 0;
      const discountPct = form.discount_pct || 0;
      const finalValue = listPrice * (1 - discountPct / 100);

      const { data: userData } = await supabase.auth.getUser();

      // Build diagnostico_dores
      const diagnosticoDores = form.diagnostico_dores.filter(d => d.title.trim() || d.desc.trim());

      // Fetch selected cases from bank and build cases JSONB
      let casesJsonb: any[] = [];
      if (form.selected_case_ids.length > 0) {
        const { data: casesData } = await supabase
          .from('proposal_cases' as any)
          .select('*')
          .in('id', form.selected_case_ids);
        if (casesData) {
          casesJsonb = (casesData as unknown as ProposalCase[]).map(c => {
            const tags = Array.isArray(c.tags) && c.tags.length > 0 ? c.tags : (c.tipo ? [c.tipo] : []);
            return {
              tipo: tags[0] || '',
              titulo: c.client_name,
              descricao: c.campaign_name,
              vimeoId: c.vimeo_id,
              vimeoHash: c.vimeo_hash,
              destaque: c.destaque,
            };
          });
        }
      }

      // Build entregaveis JSONB matching ProposalEntregaveis format
      const entregaveisJsonb: any[] = [];

      // Block 1: Output items (deliverables)
      if (form.entregaveis.length > 0) {
        entregaveisJsonb.push({
          label: 'Output',
          titulo: 'Entregas do Projeto',
          itens: form.entregaveis.map(e => ({
            titulo: e.titulo,
            descricao: e.descricao,
            quantidade: e.quantidade,
            icone: e.icone,
          })),
        });
      }

      // Block 2: All incluso categories grouped into one "Serviços" block
      const serviceCards: any[] = [];
      for (const cat of form.incluso_categories) {
        if (cat.subcategorias) {
          serviceCards.push({
            icone: cat.icone,
            titulo: cat.categoria,
            subcategorias: cat.subcategorias.map(sub => ({
              nome: sub.nome,
              itens: sub.itens.map(item => ({
                nome: item.nome,
                ativo: item.ativo,
                quantidade: item.quantidade || undefined,
              })),
            })),
          });
        } else if (cat.itens) {
          serviceCards.push({
            icone: cat.icone,
            titulo: cat.categoria,
            itens: cat.itens.map(item => ({
              nome: item.nome,
              ativo: item.ativo,
              quantidade: item.quantidade || undefined,
            })),
          });
        }
      }
      if (serviceCards.length > 0) {
        entregaveisJsonb.push({
          label: 'Serviços',
          titulo: 'O que está incluso no processo',
          cards: serviceCards,
        });
      }

      // Build payment options — use form data if provided, else fallback
      const paymentOptions = form.payment_options && form.payment_options.length > 0
        ? form.payment_options
        : [
            {
              titulo: 'À Vista',
              valor: formatMoney(finalValue * 0.95),
              descricao: '5% de desconto para pagamento único',
              destaque: 'Melhor custo',
              recomendado: false,
            },
            {
              titulo: '2x sem juros',
              valor: `2x ${formatMoney(finalValue / 2)}`,
              descricao: '50% no fechamento + 50% na entrega',
              destaque: '',
              recomendado: true,
            },
          ];

      const { data, error } = await supabase
        .from('orcamentos')
        .insert({
          slug,
          client_name: form.client_name.trim(),
          project_name: form.project_name.trim(),
          project_number: form.project_number || null,
          client_responsible: form.client_responsible.trim() || null,
          client_logo: form.client_logo.trim() || null,
          validity_date: form.validity_date ? form.validity_date.toLocaleDateString('en-CA') : undefined,
          sent_date: form.sent_date.toLocaleDateString('en-CA'),
          base_value: finalValue,
          discount_pct: discountPct,
          final_value: finalValue,
          list_price: listPrice || null,
          payment_terms: form.payment_terms.trim(),
          created_by: userData?.user?.id || null,
          status: 'sent',
          objetivo: form.objetivo.trim() || null,
          diagnostico_dores: diagnosticoDores as any,
          payment_options: paymentOptions as any,
          testimonial_name: form.testimonial_name.trim() || null,
          testimonial_role: form.testimonial_role.trim() || null,
          testimonial_text: form.testimonial_text.trim() || null,
          testimonial_image: form.testimonial_image.trim() || null,
          entregaveis: entregaveisJsonb as any,
          cases: casesJsonb as any,
          whatsapp_number: form.whatsapp_number.trim() || null,
          company_description: form.company_description.trim() || null,
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

  const updateProposal = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Record<string, any>> }) => {
      if (data.client_name || data.project_name || data.project_number) {
        const { data: current } = await supabase
          .from('orcamentos')
          .select('client_name, project_name, project_number, version')
          .eq('id', id)
          .single();

        const clientName = (data.client_name as string) || current?.client_name || '';
        const projectName = (data.project_name as string) || current?.project_name || '';
        const projectNumber = (data.project_number as string) || current?.project_number;

        let newSlug = generateSlug(clientName, projectName, projectNumber, current?.version);

        const { data: existing } = await supabase
          .from('orcamentos')
          .select('slug')
          .eq('slug', newSlug)
          .neq('id', id)
          .maybeSingle();

        if (existing) {
          newSlug = `${newSlug}-${Math.random().toString(36).slice(2, 6)}`;
        }

        data.slug = newSlug;
      }

      const { error } = await supabase
        .from('orcamentos')
        .update(data as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposal-details'] });
    },
    onError: (err: Error) => {
      toast.error('Erro ao atualizar proposta: ' + err.message);
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

  const createDraft = useMutation({
    mutationFn: async () => {
      const tempSlug = `rascunho-${Math.random().toString(36).substring(2, 9)}`;
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('orcamentos')
        .insert({
          slug: tempSlug,
          status: 'draft',
          created_by: userData?.user?.id || null,
        } as any)
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
    onError: (err: Error) => {
      toast.error('Erro ao criar rascunho: ' + err.message);
    },
  });

  const createNewVersion = useMutation({
    mutationFn: async (originalId: string) => {
      const { data: original, error: fetchError } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('id', originalId)
        .single();
      if (fetchError || !original) throw new Error('Proposta não encontrada');

      const parentId = (original as any).parent_id || original.id;

      const { data: versions } = await supabase
        .from('orcamentos')
        .select('version')
        .or(`id.eq.${parentId},parent_id.eq.${parentId}`)
        .order('version' as any, { ascending: false })
        .limit(1);

      const nextVersion = ((versions as any)?.[0]?.version || 1) + 1;

      await supabase
        .from('orcamentos')
        .update({ is_latest_version: false } as any)
        .or(`id.eq.${parentId},parent_id.eq.${parentId}`);

      const { id, created_at, updated_at, slug, version, is_latest_version, views_count, ...rest } = original as any;
      const newSlug = generateSlug(rest.client_name, rest.project_name, rest.project_number, nextVersion);

      const { data: newProposal, error } = await supabase
        .from('orcamentos')
        .insert({
          ...rest,
          slug: newSlug,
          version: nextVersion,
          parent_id: parentId,
          is_latest_version: true,
          status: 'sent',
          sent_date: new Date().toLocaleDateString('en-CA'),
          views_count: 0,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return mapProposal(newProposal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Nova versão criada!');
    },
    onError: (err: Error) => {
      toast.error('Erro ao criar versão: ' + err.message);
    },
  });

  const duplicateProposal = useMutation({
    mutationFn: async (id: string) => {
      const { data: original, error: fetchError } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchError || !original) throw new Error('Proposta não encontrada');

      const { id: _id, created_at, updated_at, views_count, parent_id, version, is_latest_version, slug, ...rest } = original as any;

      let newSlug = generateSlug(rest.client_name || '', rest.project_name || '', rest.project_number, 1);
      const { data: existing } = await supabase
        .from('orcamentos')
        .select('slug')
        .eq('slug', newSlug)
        .maybeSingle();
      if (existing) {
        newSlug = `${newSlug}-${Math.random().toString(36).slice(2, 6)}`;
      }

      const { data, error } = await supabase
        .from('orcamentos')
        .insert({
          ...rest,
          slug: newSlug,
          status: 'draft',
          views_count: 0,
          version: 1,
          parent_id: null,
          is_latest_version: true,
          sent_date: new Date().toLocaleDateString('en-CA'),
        } as any)
        .select()
        .single();

      if (error) throw error;
      return mapProposal(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposta duplicada com sucesso!');
    },
    onError: (err: Error) => {
      toast.error('Erro ao duplicar proposta: ' + err.message);
    },
  });

  return { ...query, createProposal, createDraft, updateProposal, deleteProposal, createNewVersion, duplicateProposal };
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
    version: row.version || 1,
    parent_id: row.parent_id || null,
    is_latest_version: row.is_latest_version !== false,
  };
}
