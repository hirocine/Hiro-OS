import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryClient';
import { Task, TaskPriority, TaskStatus } from '../types';
import { logger } from '@/lib/logger';

interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: string;
  assigned_to_me?: boolean;
  search?: string;
  is_private?: boolean;
}

/**
 * Hook para buscar tasks - apenas queries (leitura)
 * Para mutations (criar/atualizar/deletar), use useTaskMutations
 */
export function useTasks(filters?: TaskFilters) {
  // Fetch tasks
  const { data: tasks = [], isLoading, error, refetch } = useQuery({
    queryKey: filters?.is_private 
      ? [...queryKeys.tasks.list, 'private']
      : filters?.assigned_to_me 
        ? queryKeys.tasks.mine 
        : filters?.status 
          ? [...queryKeys.tasks.list, filters.status]
          : queryKeys.tasks.list,
    staleTime: 2 * 60 * 1000, // 2 minutes - prevents unnecessary refetch
    queryFn: async () => {
      logger.debug('Fetching tasks', { module: 'tasks', data: { filters } });

      let query = supabase
        .from('tasks')
        .select(`
          *,
          profiles:assigned_to (
            display_name,
            avatar_url
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
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters?.assigned_to_me) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          query = query.eq('assigned_to', user.id);
        }
      }
      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }
      if (filters?.is_private !== undefined) {
        query = query.eq('is_private', filters.is_private);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching tasks', { module: 'tasks', error });
        throw error;
      }

      // Transform data with joined profile info
      const transformedTasks: Task[] = (data || []).map((task: any) => ({
        ...task,
        assignee_name: task.profiles?.display_name || null,
        assignee_avatar: task.profiles?.avatar_url || null,
      }));

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
