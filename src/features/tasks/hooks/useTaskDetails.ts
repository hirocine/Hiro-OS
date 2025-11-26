import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryClient';
import { TaskWithDetails, TaskSubtask, TaskComment, TaskAttachment } from '../types';
import { logger } from '@/lib/logger';
import { enhancedToast } from '@/components/ui/enhanced-toast';

export function useTaskDetails(taskId: string) {
  const queryClient = useQueryClient();

  // Fetch task with all related data
  const { data: task, isLoading, error } = useQuery({
    queryKey: queryKeys.tasks.detail(taskId),
    queryFn: async (): Promise<TaskWithDetails> => {
      logger.debug('Fetching task details', { module: 'tasks', data: { taskId } });

      // Fetch task
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select(`
          *,
          profiles:assigned_to (
            display_name,
            avatar_url
          )
        `)
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;

      // Fetch subtasks
      const { data: subtasks, error: subtasksError } = await supabase
        .from('task_subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('display_order', { ascending: true });

      if (subtasksError) throw subtasksError;

      // Fetch comments
      const { data: comments, error: commentsError } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Fetch attachments
      const { data: attachments, error: attachmentsError } = await supabase
        .from('task_attachments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (attachmentsError) throw attachmentsError;

      return {
        ...taskData,
        assignee_name: taskData.profiles?.display_name || null,
        assignee_avatar: taskData.profiles?.avatar_url || null,
        subtasks: (subtasks || []) as TaskSubtask[],
        comments: (comments || []) as TaskComment[],
        attachments: (attachments || []) as TaskAttachment[],
      } as TaskWithDetails;
    },
    enabled: !!taskId,
  });

  // Add subtask
  const addSubtask = useMutation({
    mutationFn: async (title: string) => {
      const { data, error } = await supabase
        .from('task_subtasks')
        .insert([{ task_id: taskId, title, display_order: (task?.subtasks.length || 0) }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
    },
  });

  // Update subtask
  const updateSubtask = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TaskSubtask> }) => {
      const { data, error } = await supabase
        .from('task_subtasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
    },
  });

  // Delete subtask
  const deleteSubtask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_subtasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
    },
  });

  // Add comment
  const addComment = useMutation({
    mutationFn: async (content: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Get user name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();

      const { data, error } = await supabase
        .from('task_comments')
        .insert([{
          task_id: taskId,
          user_id: user.id,
          user_name: profile?.display_name || user.email,
          content,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      enhancedToast.success({ title: 'Comentário adicionado!' });
    },
  });

  // Delete comment
  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_comments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
    },
  });

  // Delete attachment
  const deleteAttachment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
    },
  });

  return {
    task,
    isLoading,
    error,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    addComment,
    deleteComment,
    deleteAttachment,
  };
}
