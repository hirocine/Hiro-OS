import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

interface SectionStats {
  active: number;
  overdue: number;
  urgent: number;
}

interface TaskSectionStats {
  team: SectionStats;
  private: SectionStats;
  isLoading: boolean;
}

export function useTaskSectionStats(): TaskSectionStats {
  const { user } = useAuthContext();

  const { data, isLoading } = useQuery({
    queryKey: ['task-section-stats', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      // Fetch all non-completed/archived tasks
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id, priority, due_date, is_private, status, created_by')
        .not('status', 'in', '("concluida","arquivada")');

      if (error) throw error;

      const teamStats: SectionStats = { active: 0, overdue: 0, urgent: 0 };
      const privateStats: SectionStats = { active: 0, overdue: 0, urgent: 0 };

      tasks?.forEach(task => {
        const isPrivate = task.is_private && task.created_by === user?.id;
        const isTeam = !task.is_private;
        
        if (!isPrivate && !isTeam) return;

        const stats = isPrivate ? privateStats : teamStats;

        // Count active (pendente or em_progresso)
        if (task.status === 'pendente' || task.status === 'em_progresso') {
          stats.active++;
        }

        // Count overdue
        if (task.due_date && task.due_date < today && task.status !== 'concluida') {
          stats.overdue++;
        }

        // Count urgent
        if (task.priority === 'urgente') {
          stats.urgent++;
        }
      });

      return { team: teamStats, private: privateStats };
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchInterval: 30000,
  });

  return {
    team: data?.team ?? { active: 0, overdue: 0, urgent: 0 },
    private: data?.private ?? { active: 0, overdue: 0, urgent: 0 },
    isLoading,
  };
}
