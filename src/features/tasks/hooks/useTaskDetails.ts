import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryClient';
import { TaskWithDetails, TaskSubtask, TaskComment, TaskAttachment, TaskLink, TaskLinkType } from '../types';
import { logger } from '@/lib/logger';
import { enhancedToast } from '@/components/ui/enhanced-toast';

// Helper to detect link type from URL
function detectLinkType(url: string): TaskLinkType {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('drive.google.com') || lowerUrl.includes('docs.google.com')) {
    return 'google_drive';
  }
  if (lowerUrl.includes('dropbox.com')) {
    return 'dropbox';
  }
  if (lowerUrl.includes('notion.so') || lowerUrl.includes('notion.site')) {
    return 'notion';
  }
  if (lowerUrl.includes('onedrive.live.com') || lowerUrl.includes('sharepoint.com')) {
    return 'onedrive';
  }
  return 'other';
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

      // Fetch links
      const { data: links, error: linksError } = await supabase
        .from('task_links')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (linksError) throw linksError;

      return {
        ...taskData,
        assignee_name: taskData.profiles?.display_name || null,
        assignee_avatar: taskData.profiles?.avatar_url || null,
        subtasks: (subtasks || []) as TaskSubtask[],
        comments: (comments || []) as TaskComment[],
        attachments: (attachments || []) as TaskAttachment[],
        links: (links || []) as TaskLink[],
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      addTaskHistoryEntry(taskId, `Subtarefa "${data.title}" adicionada`, 'subtasks');
    },
  });

  // Update subtask
  const updateSubtask = useMutation({
    mutationFn: async ({ id, updates, subtaskTitle }: { id: string; updates: Partial<TaskSubtask>; subtaskTitle?: string }) => {
      const { data, error } = await supabase
        .from('task_subtasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, updates, subtaskTitle };
    },
    onSuccess: ({ data, updates, subtaskTitle }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      if (updates.is_completed !== undefined) {
        const title = subtaskTitle || data.title;
        const action = updates.is_completed 
          ? `Subtarefa "${title}" marcada como concluída`
          : `Subtarefa "${title}" desmarcada`;
        addTaskHistoryEntry(taskId, action, 'subtasks');
      }
    },
  });

  // Delete subtask
  const deleteSubtask = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase
        .from('task_subtasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return title;
    },
    onSuccess: (title) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      addTaskHistoryEntry(taskId, `Subtarefa "${title}" removida`, 'subtasks');
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
      addTaskHistoryEntry(taskId, 'Comentário adicionado', 'comments');
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
      addTaskHistoryEntry(taskId, 'Comentário removido', 'comments');
    },
  });

  // Delete attachment
  const deleteAttachment = useMutation({
    mutationFn: async ({ id, fileName }: { id: string; fileName: string }) => {
      const { error } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return fileName;
    },
    onSuccess: (fileName) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      addTaskHistoryEntry(taskId, `Anexo "${fileName}" removido`, 'attachments');
    },
  });

  // Add link
  const addLink = useMutation({
    mutationFn: async ({ url, title }: { url: string; title: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const linkType = detectLinkType(url);

      const { data, error } = await supabase
        .from('task_links')
        .insert([{
          task_id: taskId,
          url,
          title,
          link_type: linkType,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      addTaskHistoryEntry(taskId, `Link "${data.title}" adicionado`, 'links');
      enhancedToast.success({ title: 'Link adicionado!' });
    },
  });

  // Delete link
  const deleteLink = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase
        .from('task_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return title;
    },
    onSuccess: (title) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      addTaskHistoryEntry(taskId, `Link "${title}" removido`, 'links');
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
    addLink,
    deleteLink,
  };
}
