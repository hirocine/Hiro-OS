import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryClient, queryKeys } from '@/lib/queryClient';
import { logger } from '@/lib/logger';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { Task } from '../types';

/**
 * Hook separado para mutations de tasks sem subscription real-time
 * Usado em componentes que apenas precisam criar/atualizar/deletar tasks
 * sem necessidade de escutar mudanças em tempo real
 */
export function useTaskMutations() {
  // Create task
  const createTask = useMutation({
    mutationFn: async (newTask: Omit<Partial<Task>, 'created_by' | 'created_at' | 'updated_at'> & { title: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

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
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.team });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.mine });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.stats });
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
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.team });
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.mine });

      const previousTeamTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks.team);
      const previousMyTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks.mine);

      const updateCache = (oldTasks?: Task[]) => {
        if (!oldTasks) return oldTasks;
        return oldTasks.map((task) =>
          task.id === id ? { ...task, ...updates } : task
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
    onSuccess: () => {
      enhancedToast.success({ title: 'Tarefa atualizada!' });
    },
  });

  // Delete task
  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.team });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.mine });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.stats });
      enhancedToast.success({ title: 'Tarefa excluída com sucesso!' });
    },
    onError: (error: Error) => {
      logger.error('Error deleting task', { module: 'tasks', error });
      enhancedToast.error({ title: 'Erro ao excluir tarefa', description: error.message });
    },
  });

  return {
    createTask,
    updateTask,
    deleteTask,
  };
}
