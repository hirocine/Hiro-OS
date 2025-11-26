import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryClient';
import { Task, TaskPriority, TaskStatus } from '../types';
import { logger } from '@/lib/logger';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { useEffect, useRef } from 'react';

interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: string;
  is_team_task?: boolean;
  search?: string;
}

export function useTasks(filters?: TaskFilters) {
  const queryClient = useQueryClient();

  // Fetch tasks
  const { data: tasks = [], isLoading, error, refetch } = useQuery({
    queryKey: filters?.is_team_task ? queryKeys.tasks.team : queryKeys.tasks.mine,
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
      if (filters?.is_team_task !== undefined) {
        query = query.eq('is_team_task', filters.is_team_task);
      }
      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
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

  // Flag para pausar subscription durante mutações
  const isMutatingRef = useRef(false);

  // Real-time subscription com debounce e pausa durante mutações
  useEffect(() => {
    const channelName = filters?.is_team_task ? 'tasks-changes-team' : 'tasks-changes-mine';
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        () => {
          // Ignorar eventos durante mutações para evitar race conditions
          if (isMutatingRef.current) {
            logger.debug('Ignoring real-time event during mutation', { module: 'tasks' });
            return;
          }

          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            logger.debug('Task changed, refetching', { module: 'tasks' });
            refetch();
          }, 300);
        }
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [refetch, filters?.is_team_task]);

  // Create task
  const createTask = useMutation({
    mutationFn: async (newTask: Omit<Partial<Task>, 'created_by' | 'created_at' | 'updated_at'> & { title: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const taskData = {
        ...newTask,
        created_by: user.id,
        assigned_to: newTask.assigned_to || null,
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      enhancedToast.success({ title: 'Tarefa criada com sucesso!' });
    },
    onError: (error: Error) => {
      logger.error('Error creating task', { module: 'tasks', error });
      enhancedToast.error({ title: 'Erro ao criar tarefa', description: error.message });
    },
  });

  // Update task com optimistic update
  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const sanitizedUpdates = {
        ...updates,
        assigned_to: updates.assigned_to === '' ? null : updates.assigned_to,
      };

      const { data, error } = await supabase
        .from('tasks')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    // Optimistic update - atualiza cache imediatamente
    onMutate: async ({ id, updates }) => {
      // Pausar subscription durante mutação
      isMutatingRef.current = true;

      // Cancelar queries em andamento para evitar race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.team });
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.mine });

      // Snapshot do estado anterior
      const previousTeamTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks.team);
      const previousMyTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks.mine);

      const updateCache = (oldTasks?: Task[]) => {
        if (!oldTasks) return oldTasks;
        return oldTasks.map((task) =>
          task.id === id
            ? {
                ...task,
                ...updates,
              }
            : task
        );
      };

      queryClient.setQueryData<Task[] | undefined>(queryKeys.tasks.team, updateCache(previousTeamTasks));
      queryClient.setQueryData<Task[] | undefined>(queryKeys.tasks.mine, updateCache(previousMyTasks));

      return { previousTeamTasks, previousMyTasks };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousTeamTasks) {
        queryClient.setQueryData(queryKeys.tasks.team, context.previousTeamTasks);
      }
      if (context?.previousMyTasks) {
        queryClient.setQueryData(queryKeys.tasks.mine, context.previousMyTasks);
      }
      logger.error('Error updating task', { module: 'tasks', error });
      enhancedToast.error({ title: 'Erro ao atualizar tarefa', description: error.message });
    },
    onSettled: () => {
      // Aguardar antes de reativar subscription para evitar capturar o próprio evento de update
      setTimeout(() => {
        isMutatingRef.current = false;
      }, 500);
    },
    onSuccess: () => {
      enhancedToast.success({ title: 'Tarefa atualizada!' });
    },
  });

  // Delete task
  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      enhancedToast.success({ title: 'Tarefa excluída!' });
    },
    onError: (error: Error) => {
      logger.error('Error deleting task', { module: 'tasks', error });
      enhancedToast.error({ title: 'Erro ao excluir tarefa', description: error.message });
    },
  });

  return {
    tasks,
    isLoading,
    error,
    refetch,
    createTask,
    updateTask,
    deleteTask,
  };
}

