import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryClient';
import { TaskWithDetails, TaskSubtask, TaskComment, TaskAttachment, TaskLink, TaskLinkType, TaskAssignee } from '../types';
import { logger } from '@/lib/logger';
import { enhancedToast } from '@/components/ui/enhanced-toast';

// Helper to detect link type from URL
function detectLinkType(url: string): TaskLinkType {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('drive.google.com') || lowerUrl.includes('docs.google.com')) return 'google_drive';
  if (lowerUrl.includes('dropbox.com')) return 'dropbox';
  if (lowerUrl.includes('notion.so') || lowerUrl.includes('notion.site')) return 'notion';
  if (lowerUrl.includes('onedrive.live.com') || lowerUrl.includes('sharepoint.com')) return 'onedrive';
  return 'other';
}

// Helper to add history entry
async function addTaskHistoryEntry(taskId: string, action: string, fieldChanged?: string, oldValue?: string, newValue?: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('display_name').eq('user_id', user.id).single();
    await supabase.from('task_history').insert([{
      task_id: taskId, user_id: user.id,
      user_name: profile?.display_name || user.email || 'Usuário',
      action, field_changed: fieldChanged || null, old_value: oldValue || null, new_value: newValue || null,
    }]);
  } catch (error) {
    logger.error('Failed to add history entry', { module: 'tasks', data: { error } });
  }
}

export function useTaskDetails(taskId: string) {
  const queryClient = useQueryClient();

  const { data: task, isLoading, error } = useQuery({
    queryKey: queryKeys.tasks.detail(taskId),
    queryFn: async (): Promise<TaskWithDetails> => {
      logger.debug('Fetching task details', { module: 'tasks', data: { taskId } });

      // Fetch task (with optional joined AV project name for the
      // "Projeto" chip in the detail page)
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*, audiovisual_projects:project_id(name)')
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;

      const projectName =
        (taskData as any)?.audiovisual_projects?.name ?? null;

      // Fetch assignees with profiles
      const { data: assigneesData } = await supabase
        .from('task_assignees')
        .select(`
          user_id,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .eq('task_id', taskId);

      const assignees: TaskAssignee[] = (assigneesData || []).map((a: any) => ({
        user_id: a.user_id,
        display_name: a.profiles?.display_name || null,
        avatar_url: a.profiles?.avatar_url || null,
      }));

      // Fetch subtasks, comments, attachments, links in parallel
      const [subtasksRes, commentsRes, attachmentsRes, linksRes] = await Promise.all([
        supabase.from('task_subtasks').select('*').eq('task_id', taskId).order('display_order', { ascending: true }),
        supabase.from('task_comments').select('*').eq('task_id', taskId).order('created_at', { ascending: true }),
        supabase.from('task_attachments').select('*').eq('task_id', taskId).order('created_at', { ascending: false }),
        supabase.from('task_links').select('*').eq('task_id', taskId).order('created_at', { ascending: false }),
      ]);

      return {
        ...taskData,
        project_name: projectName,
        assignees,
        assignee_name: assignees[0]?.display_name || null,
        assignee_avatar: assignees[0]?.avatar_url || null,
        subtasks: (subtasksRes.data || []) as TaskSubtask[],
        comments: (commentsRes.data || []) as TaskComment[],
        attachments: (attachmentsRes.data || []) as TaskAttachment[],
        links: (linksRes.data || []) as TaskLink[],
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
        .select().single();
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
      const { data, error } = await supabase.from('task_subtasks').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return { data, updates, subtaskTitle };
    },
    onSuccess: ({ data, updates, subtaskTitle }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      if (updates.is_completed !== undefined) {
        const title = subtaskTitle || data.title;
        const action = updates.is_completed ? `Subtarefa "${title}" marcada como concluída` : `Subtarefa "${title}" desmarcada`;
        addTaskHistoryEntry(taskId, action, 'subtasks');
      }
    },
  });

  // Delete subtask
  const deleteSubtask = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase.from('task_subtasks').delete().eq('id', id);
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
      const { data: profile } = await supabase.from('profiles').select('display_name').eq('user_id', user.id).single();
      const { data, error } = await supabase
        .from('task_comments')
        .insert([{ task_id: taskId, user_id: user.id, user_name: profile?.display_name || user.email, content }])
        .select().single();
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
      const { error } = await supabase.from('task_comments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      addTaskHistoryEntry(taskId, 'Comentário removido', 'comments');
    },
  });

  // Add attachment (upload file to storage + insert row)
  const addAttachment = useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Path: tasks/<task_id>/<random>__<original_name>
      const random = Math.random().toString(36).slice(2, 10);
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `tasks/${taskId}/${random}__${safeName}`;

      const { error: upErr } = await supabase.storage
        .from('task-attachments')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { data, error } = await supabase
        .from('task_attachments')
        .insert([{
          task_id: taskId,
          file_name: file.name,
          file_url: path,                // guardamos o PATH (privado); UI gera signed URL na hora
          file_type: file.type || null,
          file_size: file.size,
          uploaded_by: user.id,
        }])
        .select().single();
      if (error) {
        // rollback do upload
        await supabase.storage.from('task-attachments').remove([path]);
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      addTaskHistoryEntry(taskId, `Anexo "${data.file_name}" adicionado`, 'attachments');
      enhancedToast.success({ title: 'Anexo enviado!' });
    },
    onError: (err) => {
      enhancedToast.error({
        title: 'Erro ao enviar anexo',
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  // Delete attachment (removes from storage + row)
  const deleteAttachment = useMutation({
    mutationFn: async ({ id, fileName, fileUrl }: { id: string; fileName: string; fileUrl: string }) => {
      // fileUrl é o path do bucket. Remove primeiro (idempotente)
      await supabase.storage.from('task-attachments').remove([fileUrl]);
      const { error } = await supabase.from('task_attachments').delete().eq('id', id);
      if (error) throw error;
      return fileName;
    },
    onSuccess: (fileName) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      addTaskHistoryEntry(taskId, `Anexo "${fileName}" removido`, 'attachments');
    },
  });

  // Open attachment: gera signed URL e abre numa aba
  const openAttachment = async (fileUrl: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from('task-attachments')
      .createSignedUrl(fileUrl, 60 * 5); // 5 min de validade
    if (error || !data?.signedUrl) {
      enhancedToast.error({ title: 'Não consegui abrir o anexo' });
      return null;
    }
    return data.signedUrl;
  };

  // Add link
  const addLink = useMutation({
    mutationFn: async ({ url, title }: { url: string; title: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      const linkType = detectLinkType(url);
      const { data, error } = await supabase
        .from('task_links')
        .insert([{ task_id: taskId, url, title, link_type: linkType, created_by: user.id }])
        .select().single();
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
      const { error } = await supabase.from('task_links').delete().eq('id', id);
      if (error) throw error;
      return title;
    },
    onSuccess: (title) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      addTaskHistoryEntry(taskId, `Link "${title}" removido`, 'links');
    },
  });

  return {
    task, isLoading, error,
    addSubtask, updateSubtask, deleteSubtask,
    addComment, deleteComment,
    addAttachment, deleteAttachment, openAttachment,
    addLink, deleteLink,
  };
}
