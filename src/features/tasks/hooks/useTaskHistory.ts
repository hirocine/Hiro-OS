import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryClient';

export interface TaskHistoryEntry {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  action: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export function useTaskHistory(taskId: string) {
  const queryClient = useQueryClient();

  const { data: history, isLoading } = useQuery({
    queryKey: ['task-history', taskId],
    queryFn: async (): Promise<TaskHistoryEntry[]> => {
      const { data, error } = await supabase
        .from('task_history')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TaskHistoryEntry[];
    },
    enabled: !!taskId,
  });

  const addHistoryEntry = useMutation({
    mutationFn: async (entry: {
      action: string;
      field_changed?: string;
      old_value?: string;
      new_value?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Get user name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase
        .from('task_history')
        .insert([{
          task_id: taskId,
          user_id: user.id,
          user_name: profile?.display_name || user.email || 'Usuário',
          action: entry.action,
          field_changed: entry.field_changed || null,
          old_value: entry.old_value || null,
          new_value: entry.new_value || null,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-history', taskId] });
    },
  });

  return {
    history: history || [],
    isLoading,
    addHistoryEntry,
  };
}
