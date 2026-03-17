import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

interface SectionStats {
  active: number;
  overdue: number;
  urgent: number;
}

interface TaskSectionStats {
  stats: SectionStats;
  isLoading: boolean;
}

export function useTaskSectionStats(): TaskSectionStats {
  const { user } = useAuthContext();

  const { data, isLoading } = useQuery({
    queryKey: ['task-section-stats', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id, priority, due_date, status')
        .not('status', 'in', '("concluida","arquivada")');

      if (error) throw error;

      const stats: SectionStats = { active: 0, overdue: 0, urgent: 0 };

      tasks?.forEach(task => {
        if (task.status === 'pendente' || task.status === 'em_progresso') {
          stats.active++;
        }
        if (task.due_date && task.due_date < today) {
          stats.overdue++;
        }
        if (task.priority === 'urgente') {
          stats.urgent++;
        }
      });

      return stats;
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchInterval: 30000,
  });

  return {
    stats: data ?? { active: 0, overdue: 0, urgent: 0 },
    isLoading,
  };
}
