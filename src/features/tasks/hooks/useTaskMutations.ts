import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryClient';
import { logger } from '@/lib/logger';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { Task, PRIORITY_CONFIG, STATUS_CONFIG } from '../types';
import type { Json } from '@/integrations/supabase/types';

// Helper to log audit entry
async function logAuditEntry(
  action: string,
  tableName: string,
  recordId?: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
) {
  try {
    await supabase.rpc('log_audit_entry', {
      _action: action,
      _table_name: tableName,
      _record_id: recordId,
      _old_values: oldValues as Json,
      _new_values: newValues as Json,
    });
  } catch (error) {
    logger.error('Failed to log audit entry', { module: 'tasks', data: { error } });
  }
}

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
 * Hook para mutations de tasks com suporte a multi-assignee
 */
export function useTaskMutations() {
  const queryClient = useQueryClient();
  
  // Create task
  const createTask = useMutation({
    mutationFn: async (newTask: Omit<Partial<Task>, 'created_by' | 'created_at' | 'updated_at'> & { title: string; assignee_ids?: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const { assignee_ids, assignees, ...taskFields } = newTask as any;

      const taskData = {
        ...taskFields,
        created_by: user.id,
        assigned_to: null, // Keep for backward compat but use task_assignees
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) throw error;

      // Default: assign the task to its creator if no explicit list given.
      // The Nova Tarefa dialog no longer asks for responsáveis — the
      // creator is auto-assigned. Reattribution happens later via the
      // inline assignee cell on the table / detail page.
      const idsToInsert = (assignee_ids && assignee_ids.length > 0)
        ? assignee_ids
        : [user.id];
      const { error: assigneeError } = await supabase
        .from('task_assignees')
        .insert(idsToInsert.map((uid: string) => ({ task_id: data.id, user_id: uid })));
      if (assigneeError) {
        logger.error('Error inserting task assignees', { module: 'tasks', error: assigneeError });
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.mine });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.stats });
      enhancedToast.success({ title: 'Tarefa criada com sucesso!' });
      
      addTaskHistoryEntry(data.id, 'Tarefa criada');
      
      logAuditEntry('create_task', 'tasks', data.id, undefined, {
        title: data.title,
        status: data.status,
        priority: data.priority,
        department: data.department,
      });
    },
    onError: (error: Error) => {
      logger.error('Error creating task', { module: 'tasks', error });
      enhancedToast.error({ title: 'Erro ao criar tarefa', description: error.message });
    },
  });

  // Update task
  const updateTask = useMutation({
    mutationFn: async ({ id, updates, oldTask }: { id: string; updates: Partial<Task>; oldTask?: Partial<Task> }) => {
      const { assignees, ...dbUpdates } = updates as any;
      
      const sanitizedUpdates = {
        ...dbUpdates,
        assigned_to: undefined, // Don't update assigned_to directly anymore
      };
      // Remove undefined keys
      Object.keys(sanitizedUpdates).forEach(key => {
        if (sanitizedUpdates[key] === undefined) delete sanitizedUpdates[key];
      });

      // Only update tasks table if there are actual updates
      let data;
      if (Object.keys(sanitizedUpdates).length > 0) {
        const result = await supabase
          .from('tasks')
          .update(sanitizedUpdates)
          .eq('id', id)
          .select()
          .single();

        if (result.error) throw result.error;
        data = result.data;
      } else {
        const result = await supabase.from('tasks').select().eq('id', id).single();
        if (result.error) throw result.error;
        data = result.data;
      }

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
      const trackableFields = ['title', 'status', 'priority', 'due_date', 'department', 'description'];
      
      for (const field of trackableFields) {
        if (updates[field as keyof typeof updates] !== undefined) {
          const oldValue = oldTask?.[field as keyof typeof oldTask];
          const newValue = updates[field as keyof typeof updates];
          
          if (oldValue === newValue) continue;
          
          const fieldLabel = getFieldLabel(field);
          const oldFormatted = formatFieldValue(field, oldValue);
          const newFormatted = formatFieldValue(field, newValue);
          
          let action: string;
          if (field === 'description') {
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

  // Update task assignees
  const updateAssignees = useMutation({
    mutationFn: async ({ taskId, assigneeIds }: { taskId: string; assigneeIds: string[] }) => {
      // Delete all current assignees
      await supabase.from('task_assignees').delete().eq('task_id', taskId);

      // Insert new assignees
      if (assigneeIds.length > 0) {
        const { error } = await supabase
          .from('task_assignees')
          .insert(assigneeIds.map(uid => ({ task_id: taskId, user_id: uid })));
        if (error) throw error;
      }

      return { taskId, assigneeIds };
    },
    onSuccess: ({ taskId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.mine });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      enhancedToast.success({ title: 'Responsáveis atualizados!' });
      
      addTaskHistoryEntry(taskId, 'Responsáveis alterados');
    },
    onError: (error: Error) => {
      logger.error('Error updating assignees', { module: 'tasks', error });
      enhancedToast.error({ title: 'Erro ao atualizar responsáveis', description: error.message });
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
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.mine });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.stats });
      enhancedToast.success({ title: 'Tarefa excluída com sucesso!' });
      
      logAuditEntry('delete_task', 'tasks', taskId);
    },
    onError: (error: Error) => {
      logger.error('Error deleting task', { module: 'tasks', error });
      enhancedToast.error({ title: 'Erro ao excluir tarefa', description: error.message });
    },
  });

  return {
    createTask,
    updateTask,
    updateAssignees,
    deleteTask,
  };
}
