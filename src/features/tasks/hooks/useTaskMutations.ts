import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryClient';
import { logger } from '@/lib/logger';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { Task, PRIORITY_CONFIG, STATUS_CONFIG } from '../types';

// Helper to add history entry
async function addTaskHistoryEntry(
  taskId: string,
  action: string,
  fieldChanged?: string,
  oldValue?: string,
  newValue?: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .single();

    await supabase.from('task_history').insert([{
      task_id: taskId,
      user_id: user.id,
      user_name: profile?.display_name || user.email || 'Usuário',
      action,
      field_changed: fieldChanged || null,
      old_value: oldValue || null,
      new_value: newValue || null,
    }]);
  } catch (error) {
    logger.error('Failed to add history entry', { module: 'tasks', data: { error } });
  }
}

// Helper to get human-readable labels
function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    title: 'Título',
    status: 'Status',
    priority: 'Prioridade',
    due_date: 'Prazo',
    department: 'Departamento',
    assigned_to: 'Responsável',
    description: 'Descrição',
  };
  return labels[field] || field;
}

function formatFieldValue(field: string, value: any, users?: any[]): string {
  if (value === null || value === undefined || value === '') {
    return 'vazio';
  }
  
  if (field === 'status') {
    return STATUS_CONFIG[value as keyof typeof STATUS_CONFIG]?.label || value;
  }
  
  if (field === 'priority') {
    return PRIORITY_CONFIG[value as keyof typeof PRIORITY_CONFIG]?.label || value;
  }
  
  if (field === 'due_date') {
    try {
      const [year, month, day] = value.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return value;
    }
  }
  
  return String(value);
}

/**
 * Hook separado para mutations de tasks sem subscription real-time
 * Usado em componentes que apenas precisam criar/atualizar/deletar tasks
 * sem necessidade de escutar mudanças em tempo real
 */
export function useTaskMutations() {
  const queryClient = useQueryClient();
  
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.mine });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.stats });
      enhancedToast.success({ title: 'Tarefa criada com sucesso!' });
      
      // Add history entry for task creation
      addTaskHistoryEntry(data.id, 'Tarefa criada');
    },
    onError: (error: Error) => {
      logger.error('Error creating task', { module: 'tasks', error });
      enhancedToast.error({ title: 'Erro ao criar tarefa', description: error.message });
    },
  });

  // Update task
  const updateTask = useMutation({
    mutationFn: async ({ id, updates, oldTask }: { id: string; updates: Partial<Task>; oldTask?: Partial<Task> }) => {
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
      return { data, updates, oldTask };
    },
    onSuccess: ({ data, updates, oldTask }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.mine });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: ['task-history', data.id] });
      enhancedToast.success({ title: 'Tarefa atualizada!' });
      
      // Add history entries for each changed field
      const trackableFields = ['title', 'status', 'priority', 'due_date', 'department', 'assigned_to', 'description'];
      
      for (const field of trackableFields) {
        if (updates[field as keyof typeof updates] !== undefined) {
          const oldValue = oldTask?.[field as keyof typeof oldTask];
          const newValue = updates[field as keyof typeof updates];
          
          // Skip if values are the same
          if (oldValue === newValue) continue;
          
          const fieldLabel = getFieldLabel(field);
          const oldFormatted = formatFieldValue(field, oldValue);
          const newFormatted = formatFieldValue(field, newValue);
          
          let action: string;
          if (field === 'assigned_to') {
            // For assignee, we need special handling as it's a user_id
            if (!newValue) {
              action = 'Responsável removido';
            } else if (!oldValue) {
              action = 'Responsável definido';
            } else {
              action = 'Responsável alterado';
            }
          } else if (field === 'description') {
            action = 'Descrição alterada';
          } else if (field === 'title') {
            action = 'Título alterado';
          } else if (!newValue || newValue === '') {
            action = `${fieldLabel} removido`;
          } else if (!oldValue || oldValue === '') {
            action = `${fieldLabel} definido para ${newFormatted}`;
          } else {
            action = `${fieldLabel} alterado de ${oldFormatted} para ${newFormatted}`;
          }
          
          addTaskHistoryEntry(
            data.id,
            action,
            field,
            oldFormatted !== 'vazio' ? oldFormatted : undefined,
            newFormatted !== 'vazio' ? newFormatted : undefined
          );
        }
      }
    },
    onError: (error: Error) => {
      logger.error('Error updating task', { module: 'tasks', error });
      enhancedToast.error({ title: 'Erro ao atualizar tarefa', description: error.message });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list });
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
