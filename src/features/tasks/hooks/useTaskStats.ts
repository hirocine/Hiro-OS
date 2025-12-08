import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryClient';
import { TaskStats } from '../types';
import { logger } from '@/lib/logger';

export function useTaskStats() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: queryKeys.tasks.stats,
    queryFn: async (): Promise<TaskStats> => {
      logger.debug('Fetching task stats', { module: 'tasks' });

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('status, priority, due_date, is_private');

      if (error) {
        logger.error('Error fetching task stats', { module: 'tasks', error });
        throw error;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Parse date string in local timezone to avoid UTC conversion issues
      const parseLocalDate = (dateStr: string): Date => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
      };

      const active = tasks.filter(t => t.status === 'pendente' || t.status === 'em_progresso').length;
      const urgent = tasks.filter(t => t.priority === 'urgente' && t.status !== 'concluida' && t.status !== 'arquivada').length;
      const overdue = tasks.filter(t => {
        if (!t.due_date || t.status === 'concluida' || t.status === 'arquivada') return false;
        const dueDate = parseLocalDate(t.due_date);
        return dueDate < today;
      }).length;
      const privateCount = tasks.filter(t => t.is_private && t.status !== 'concluida' && t.status !== 'arquivada').length;

      logger.debug('Task stats calculated', { module: 'tasks', data: { active, urgent, overdue, private: privateCount } });

      return { active, urgent, overdue, private: privateCount };
    },
    refetchInterval: 30000, // Atualiza a cada 30s
  });

  return {
    stats: stats || { active: 0, urgent: 0, overdue: 0, private: 0 },
    isLoading,
    error,
  };
}
