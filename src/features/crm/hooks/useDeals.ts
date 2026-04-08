import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Deal, DealInsert, DealUpdate, DealWithRelations } from '../types/crm.types';
import { toast } from 'sonner';

export function useDeals(contactId?: string) {
  return useQuery<DealWithRelations[]>({
    queryKey: ['crm-deals', contactId],
    queryFn: async () => {
      let query = supabase.from('crm_deals').select('*').order('created_at', { ascending: false });
      if (contactId) query = query.eq('contact_id', contactId);
      const { data: deals, error } = await query;
      if (error) throw error;

      // Fetch contacts and stages for joins
      const [contactsRes, stagesRes] = await Promise.all([
        supabase.from('crm_contacts').select('id, name'),
        supabase.from('crm_pipeline_stages').select('id, name, color, is_won, is_lost'),
      ]);

      const contactsMap = new Map((contactsRes.data ?? []).map(c => [c.id, c.name]));
      const stagesMap = new Map((stagesRes.data ?? []).map(s => [s.id, s]));

      return (deals ?? []).map(d => {
        const stage = stagesMap.get(d.stage_id);
        return {
          ...d,
          contact_name: contactsMap.get(d.contact_id) ?? 'Desconhecido',
          stage_name: stage?.name ?? '',
          stage_color: stage?.color ?? '#6366f1',
          stage_is_won: stage?.is_won ?? false,
          stage_is_lost: stage?.is_lost ?? false,
        };
      });
    },
  });
}

export function useDealMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['crm-deals'] });
    qc.invalidateQueries({ queryKey: ['crm-stats'] });
  };

  const createDeal = useMutation({
    mutationFn: async (deal: DealInsert) => {
      const { data, error } = await supabase.from('crm_deals').insert(deal).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Deal criado'); },
    onError: () => toast.error('Erro ao criar deal'),
  });

  const updateDeal = useMutation({
    mutationFn: async ({ id, ...updates }: DealUpdate & { id: string }) => {
      const { data, error } = await supabase.from('crm_deals').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Deal atualizado'); },
    onError: () => toast.error('Erro ao atualizar deal'),
  });

  const deleteDeal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('crm_deals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Deal removido'); },
    onError: () => toast.error('Erro ao remover deal'),
  });

  const moveToStage = useMutation({
    mutationFn: async ({ dealId, stageId, lostReason, isWon, isLost }: { dealId: string; stageId: string; lostReason?: string; isWon?: boolean; isLost?: boolean }) => {
      const updates: DealUpdate = { stage_id: stageId };
      if (isWon || isLost) updates.closed_at = new Date().toISOString();
      if (isLost && lostReason) updates.lost_reason = lostReason;
      const { error } = await supabase.from('crm_deals').update(updates).eq('id', dealId);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: () => toast.error('Erro ao mover deal'),
  });

  return { createDeal, updateDeal, deleteDeal, moveToStage };
}
