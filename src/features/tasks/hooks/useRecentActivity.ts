import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface RecentActivityEntry {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  action: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  task_title?: string;
}

export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: ['recent-task-activity', limit],
    queryFn: async (): Promise<RecentActivityEntry[]> => {
      logger.debug('Fetching recent task activity', { module: 'tasks', data: { limit } });

      const { data, error } = await supabase
        .from('task_history')
        .select(`
          id,
          task_id,
          user_id,
          user_name,
          action,
          field_changed,
          old_value,
          new_value,
          created_at,
          tasks(title)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching recent activity', { module: 'tasks', error });
        throw error;
      }

      return (data || []).map((entry: any) => ({
        ...entry,
        task_title: entry.tasks?.title || 'Tarefa removida',
      }));
    },
    refetchInterval: 30000, // Refresh every 30s
  });
}
