import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryClient';
import { Task, TaskPriority, TaskStatus, TaskAssignee } from '../types';
import { logger } from '@/lib/logger';

interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: string;
  assigned_to_me?: boolean;
  search?: string;
}

/**
 * Hook para buscar tasks pessoais do usuário
 * O RLS garante que só retorna tarefas que o usuário criou ou está atribuído
 */
export function useTasks(filters?: TaskFilters) {
  const { data: tasks = [], isLoading, error, refetch } = useQuery({
    queryKey: filters?.assigned_to_me 
      ? queryKeys.tasks.mine 
      : filters?.status 
        ? [...queryKeys.tasks.list, filters.status]
        : queryKeys.tasks.list,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      logger.debug('Fetching tasks', { module: 'tasks', data: { filters } });

      let query = supabase
        .from('tasks')
        .select(`
          *,
          task_assignees (
            user_id
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.assigned_to) {
        // Filter by specific assignee via task_assignees
        const { data: assigneeTaskIds } = await supabase
          .from('task_assignees')
          .select('task_id')
          .eq('user_id', filters.assigned_to);
        
        if (assigneeTaskIds) {
          query = query.in('id', assigneeTaskIds.map(a => a.task_id));
        }
      }
      if (filters?.assigned_to_me) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: assigneeTaskIds } = await supabase
            .from('task_assignees')
            .select('task_id')
            .eq('user_id', user.id);
          
          if (assigneeTaskIds && assigneeTaskIds.length > 0) {
            query = query.in('id', assigneeTaskIds.map(a => a.task_id));
          } else {
            // No tasks assigned to me, return empty
            return [];
          }
        }
      }
      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching tasks', { module: 'tasks', error });
        throw error;
      }

      // Fetch profile info for assignees
      const allUserIds = new Set<string>();
      (data || []).forEach((task: any) => {
        (task.task_assignees || []).forEach((ta: any) => allUserIds.add(ta.user_id));
      });

      let profilesMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
      if (allUserIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', Array.from(allUserIds));
        (profiles || []).forEach(p => {
          profilesMap[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url };
        });
      }

      // Transform data with joined assignees info
      const transformedTasks: Task[] = (data || []).map((task: any) => {
        const assignees: TaskAssignee[] = (task.task_assignees || []).map((ta: any) => ({
          user_id: ta.user_id,
          display_name: profilesMap[ta.user_id]?.display_name || null,
          avatar_url: profilesMap[ta.user_id]?.avatar_url || null,
        }));

        return {
          ...task,
          task_assignees: undefined,
          assignees,
          assignee_name: assignees[0]?.display_name || null,
          assignee_avatar: assignees[0]?.avatar_url || null,
        };
      });

      logger.debug('Tasks fetched successfully', { module: 'tasks', data: { count: transformedTasks.length } });
      return transformedTasks;
    },
  });

  return {
    tasks,
    isLoading,
    error,
    refetch,
  };
}
