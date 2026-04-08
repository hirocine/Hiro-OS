import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Activity, ActivityInsert } from '../types/crm.types';
import { toast } from 'sonner';

interface ActivityFilters {
  contactId?: string;
  dealId?: string;
  pending?: boolean;
}

export function useActivities(filters?: ActivityFilters) {
  return useQuery<Activity[]>({
    queryKey: ['crm-activities', filters],
    queryFn: async () => {
      let query = supabase.from('crm_activities').select('*').order('created_at', { ascending: false });
      if (filters?.contactId) query = query.eq('contact_id', filters.contactId);
      if (filters?.dealId) query = query.eq('deal_id', filters.dealId);
      if (filters?.pending !== undefined) query = query.eq('is_completed', !filters.pending);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useActivityMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['crm-activities'] });

  const createActivity = useMutation({
    mutationFn: async (activity: ActivityInsert) => {
      const { data, error } = await supabase.from('crm_activities').insert(activity).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Atividade registrada'); },
    onError: () => toast.error('Erro ao registrar atividade'),
  });

  const toggleComplete = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      const { error } = await supabase.from('crm_activities').update({
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); },
    onError: () => toast.error('Erro ao atualizar atividade'),
  });

  return { createActivity, toggleComplete };
}
