import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Proposal, ProposalFormData, ProposalCase } from '../types';

export function generateSlug(clientName: string, projectName: string): string {
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

      // Build payment options (hardcoded)
      const paymentOptions = [
        {
          titulo: 'À Vista',
          valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalValue * 0.95),
          descricao: '5% de desconto para pagamento único',
          destaque: 'Melhor custo',
          recomendado: false,
        },
        {
          titulo: '2x sem juros',
          valor: `2x ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalValue / 2)}`,
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
          status: 'draft',
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
      const { error } = await supabase
        .from('orcamentos')
        .update(data as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposta atualizada com sucesso!');
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

  return { ...query, createProposal, createDraft, updateProposal, deleteProposal };
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
