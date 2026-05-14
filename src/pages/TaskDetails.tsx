import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Trash2, Plus, Send, Link2, ExternalLink, HardDrive, Cloud, FileText, CheckSquare, MessageCircle, Paperclip, Download, Upload, Loader2, Folder } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTaskDetails } from '@/features/tasks/hooks/useTaskDetails';
import { useTaskMutations } from '@/features/tasks/hooks/useTaskMutations';
import { PriorityBadge } from '@/features/tasks/components/PriorityBadge';
import { StatusBadge } from '@/features/tasks/components/StatusBadge';
import { InlineSelectCell } from '@/features/tasks/components/InlineSelectCell';
import { InlineDateCell } from '@/features/tasks/components/InlineDateCell';
import { InlineAssigneeCell } from '@/features/tasks/components/InlineAssigneeCell';
import { InlineDepartmentCell } from '@/features/tasks/components/InlineDepartmentCell';
import { InlineEditCell } from '@/features/tasks/components/InlineEditCell';
import { MentionTextarea } from '@/features/tasks/components/MentionTextarea';
import { TaskHistorySection } from '@/features/tasks/components/TaskHistorySection';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { useUsers } from '@/hooks/useUsers';
import { useAuthContext } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { TaskComment } from '@/features/tasks/types';
import { useDepartments } from '@/features/tasks/hooks/useDepartments';
import { PRIORITY_CONFIG, STATUS_CONFIG, TaskPriority, TaskStatus, TaskLinkType } from '@/features/tasks/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Helper to get link icon based on type
function getLinkIcon(linkType: TaskLinkType) {
  switch (linkType) {
    case 'google_drive':
      return <HardDrive size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-info))' }} />;
    case 'dropbox':
      return <Cloud size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-info))' }} />;
    case 'notion':
      return <FileText size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-1))' }} />;
    case 'onedrive':
      return <Cloud size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-info))' }} />;
    default:
      return <Link2 size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />;
  }
}

// Helper to extract domain from URL
function getDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

const eyebrow: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
};

const sectionHeader: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 12,
  color: 'hsl(var(--ds-fg-1))',
  fontFamily: '"HN Display", sans-serif',
};

const sepStyle: React.CSSProperties = {
  height: 1,
  background: 'hsl(var(--ds-line-1))',
  margin: '24px 0',
};

// Details strip cell (5-column horizontal KV)
const detailCell: React.CSSProperties = {
  padding: '16px 18px',
  borderRight: '1px solid hsl(var(--ds-line-1))',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minWidth: 0,
};

const detailKey: React.CSSProperties = {
  fontFamily: '"HN Display", sans-serif',
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'hsl(var(--ds-fg-4))',
};

export default function TaskDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<TaskComment | null>(null);
  const [description, setDescription] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');

  const {
    task,
    isLoading,
    addSubtask, updateSubtask, deleteSubtask,
    addComment, deleteComment,
    addAttachment, deleteAttachment, openAttachment,
    addLink, deleteLink,
  } = useTaskDetails(id!);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    addAttachment.mutate(file);
    e.target.value = ''; // permite re-uploadar mesmo arquivo
  };

  const handleOpenAttachment = async (fileUrl: string) => {
    const url = await openAttachment(fileUrl);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  const { deleteTask, updateTask, updateAssignees } = useTaskMutations();
  const { users } = useUsers();
  const { user: currentUser } = useAuthContext();
  const currentUserProfile = users.find((u: any) => u.id === currentUser?.id);
  const currentUserName: string | null = currentUserProfile?.display_name || currentUser?.email || null;
  const currentUserAvatar: string | null = currentUserProfile?.avatar_url || null;
  const { departments } = useDepartments();

  useEffect(() => {
    if (task?.description) {
      setDescription(task.description);
    }
  }, [task?.description]);

  if (isLoading) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner" style={{ textAlign: 'center', padding: '64px 0', color: 'hsl(var(--ds-fg-3))' }}>
          Tarefa não encontrada.
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    await deleteTask.mutateAsync(task.id);
    navigate('/tarefas');
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    await addSubtask.mutateAsync(newSubtask);
    setNewSubtask('');
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await addComment.mutateAsync({
      content: newComment,
      parent_id: replyingTo?.id ?? null,
    });
    setNewComment('');
    setReplyingTo(null);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    await addComment.mutateAsync({
      content: newComment,
      parent_id: replyingTo?.id ?? null,
    });
    setNewComment('');
    setReplyingTo(null);
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkUrl.trim() || !newLinkTitle.trim()) return;
    await addLink.mutateAsync({ url: newLinkUrl, title: newLinkTitle });
    setNewLinkUrl('');
    setNewLinkTitle('');
  };

  const handleSaveDescription = async () => {
    if (description === task?.description) return;
    await updateTask.mutateAsync({
      id: task!.id,
      updates: { description: description || null },
      oldTask: {
        title: task!.title,
        status: task!.status,
        priority: task!.priority,
        due_date: task!.due_date,
        department: task!.department,
        assigned_to: task!.assigned_to,
        description: task!.description,
      }
    });
  };

  const handleUpdateTask = async (updates: Partial<typeof task>) => {
    await updateTask.mutateAsync({
      id: task.id,
      updates,
      oldTask: {
        title: task.title,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date,
        department: task.department,
        assigned_to: task.assigned_to,
        description: task.description,
      }
    });
  };

  const priorityOptions = Object.entries(PRIORITY_CONFIG).map(([value, config]) => ({
    value,
    label: config.label
  }));

  const statusOptions = Object.entries(STATUS_CONFIG).map(([value, config]) => ({
    value,
    label: config.label
  }));

  // AV projects for the "Projeto" field
  const projectsQuery = useQuery({
    queryKey: ['av_projects', 'options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audiovisual_projects')
        .select('id, name')
        .order('name', { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; name: string }>;
    },
    staleTime: 60_000,
  });

  const projectOptions = [
    { value: '__none__', label: 'Sem projeto' },
    ...(projectsQuery.data ?? []).map((p) => ({ value: p.id, label: p.name })),
  ];

  // Prazo banner data (only when overdue and task not concluida)
  const overdueDays = (() => {
    if (!task.due_date || task.status === 'concluida') return 0;
    const due = new Date(task.due_date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - due.getTime()) / (24 * 60 * 60 * 1000));
    return diff > 0 ? diff : 0;
  })();

  // Project color hash (same as TasksTable for consistency)
  const projectDotColor = (() => {
    if (!task.project_id) return 'hsl(var(--ds-fg-4))';
    let h = 0;
    for (let i = 0; i < task.project_id.length; i++) h = (h * 31 + task.project_id.charCodeAt(i)) | 0;
    return `hsl(${Math.abs(h) % 360} 55% 50%)`;
  })();

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
      <BreadcrumbNav
        items={[
          { label: 'Tarefas', href: '/tarefas' },
          { label: task.title },
        ]}
      />

      {/* ───────────────  HEADER  ─────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: -8, marginBottom: 20 }}>
        {/* Eyebrow row: projeto chip à esquerda + ações à direita */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, minHeight: 32 }}>
          {task.project_name ? (
            <button
              type="button"
              onClick={() => navigate(`/projetos-av/${task.project_id}`)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: 0,
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                fontSize: 12,
                color: 'hsl(var(--ds-fg-3))',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--ds-fg-1))')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--ds-fg-3))')}
            >
              <span style={{ width: 8, height: 8, background: projectDotColor, flexShrink: 0 }} />
              <span style={{ fontFamily: '"HN Display", sans-serif', fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                {task.project_name}
              </span>
            </button>
          ) : <span />}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn"
              onClick={() => setDeleteOpen(true)}
              style={{
                color: 'hsl(var(--ds-danger))',
                borderColor: 'hsl(var(--ds-danger) / 0.3)',
              }}
            >
              <Trash2 size={13} strokeWidth={1.5} />
              <span>Excluir</span>
            </button>
          </div>
        </div>

        {/* Title (inline-editable) — usa a classe .ph-title do DS,
            mesma altura/peso/letter-spacing dos h1 do PageHeader. */}
        <InlineEditCell
          value={task.title}
          onSave={(newTitle) => handleUpdateTask({ title: newTitle })}
          className="ph-title"
          style={{ padding: 0, margin: 0, fontSize: 'inherit', lineHeight: 1 }}
        />

        {/* Submeta: criada em / atualizada */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'hsl(var(--ds-fg-3))', flexWrap: 'wrap' }}>
          <span>
            Criada em{' '}
            <strong style={{ fontFamily: '"HN Display", sans-serif', fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
              {format(new Date(task.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
            </strong>
          </span>
          {task.updated_at && task.updated_at !== task.created_at ? (
            <>
              <span style={{ color: 'hsl(var(--ds-line-2))' }}>·</span>
              <span>
                Atualizada{' '}
                <strong style={{ fontFamily: '"HN Display", sans-serif', fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                  {format(new Date(task.updated_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                </strong>
              </span>
            </>
          ) : null}
        </div>

        {/* Banner de prazo vencido */}
        {overdueDays > 0 && task.due_date ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              border: '1px solid hsl(var(--ds-danger) / 0.3)',
              background: 'hsl(var(--ds-danger) / 0.05)',
              alignSelf: 'flex-start',
              maxWidth: '100%',
            }}
          >
            <span style={{ width: 8, height: 8, background: 'hsl(var(--ds-danger))', flexShrink: 0 }} />
            <span
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'hsl(var(--ds-danger))',
              }}
            >
              Prazo vencido
            </span>
            <span style={{ fontFamily: '"HN Display", sans-serif', fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
              {format(new Date(task.due_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
            <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
              — atrasada há {overdueDays} {overdueDays === 1 ? 'dia' : 'dias'}
            </span>
          </div>
        ) : null}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* ───────────────  DETAILS STRIP  ─────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            border: '1px solid hsl(var(--ds-line-1))',
            background: 'hsl(var(--ds-surface))',
          }}
        >
          {/* Status */}
          <div style={detailCell}>
            <span style={detailKey}>Status</span>
            <InlineSelectCell
              value={task.status}
              options={statusOptions}
              onSave={(newStatus) => handleUpdateTask({ status: newStatus as TaskStatus })}
              renderValue={(val) => <StatusBadge status={val as TaskStatus} />}
              renderOption={(val) => <StatusBadge status={val as TaskStatus} />}
            />
          </div>

          {/* Priority */}
          <div style={detailCell}>
            <span style={detailKey}>Prioridade</span>
            <InlineSelectCell
              value={task.priority}
              options={priorityOptions}
              onSave={(newPriority) => handleUpdateTask({ priority: newPriority as TaskPriority })}
              renderValue={(val) => <PriorityBadge priority={val as TaskPriority} />}
              renderOption={(val) => <PriorityBadge priority={val as TaskPriority} />}
            />
          </div>

          {/* Prazo */}
          <div style={detailCell}>
            <span style={detailKey}>Prazo</span>
            <InlineDateCell
              value={task.due_date}
              onSave={(newDate) => handleUpdateTask({ due_date: newDate })}
              isDone={task.status === 'concluida'}
            />
          </div>

          {/* Departamento */}
          <div style={detailCell}>
            <span style={detailKey}>Departamento</span>
            <InlineDepartmentCell
              value={task.department}
              departments={departments}
              onSave={(newDept) => handleUpdateTask({ department: newDept })}
            />
          </div>

          {/* Responsável */}
          <div style={detailCell}>
            <span style={detailKey}>Responsável</span>
            <InlineAssigneeCell
              value={task.assignees?.map(a => a.user_id) || (task.assigned_to ? [task.assigned_to] : [])}
              users={users}
              onSave={(newAssignees) => updateAssignees.mutate({ taskId: task.id, assigneeIds: newAssignees })}
            />
          </div>

          {/* Projeto */}
          <div style={{ ...detailCell, borderRight: 0 }}>
            <span style={detailKey}>Projeto</span>
            <InlineSelectCell
              value={task.project_id ?? '__none__'}
              options={projectOptions}
              onSave={(newValue) =>
                handleUpdateTask({
                  project_id: (newValue === '__none__' ? null : newValue) as any,
                } as any)
              }
              renderValue={(val) => {
                if (val === '__none__' || !val) {
                  return (
                    <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>Sem projeto</span>
                  );
                }
                const proj = projectOptions.find((o) => o.value === val);
                return (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      color: 'hsl(var(--ds-fg-1))',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%',
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        background: projectDotColor,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {proj?.label ?? task.project_name ?? '—'}
                    </span>
                  </span>
                );
              }}
              renderOption={(val) => {
                const proj = projectOptions.find((o) => o.value === val);
                return <span style={{ fontSize: 13 }}>{proj?.label ?? val}</span>;
              }}
            />
          </div>
        </div>

        {/* Unified Content Card */}
        <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))', padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Seção: Descrição */}
            <div>
              <h3 style={sectionHeader}>Descrição</h3>
              <div style={{ position: 'relative', border: '1px solid hsl(var(--ds-line-1))' }}>
                <Textarea
                  placeholder="Adicionar descrição..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleSaveDescription}
                  rows={3}
                  className="resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            <div style={sepStyle} />

            {/* Seção: Subtarefas */}
            <div>
              <h3 style={sectionHeader}>
                Subtarefas <span style={{ fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--ds-fg-3))', fontWeight: 400 }}>
                  ({task.subtasks.filter(s => s.is_completed).length}/{task.subtasks.length})
                </span>
              </h3>
              {task.subtasks && task.subtasks.length > 0 ? (
                <>
                  {/* Progress bar */}
                  {(() => {
                    const total = task.subtasks.length;
                    const done = task.subtasks.filter((s) => s.is_completed).length;
                    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
                    return (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          marginBottom: 14,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: '"HN Display", sans-serif',
                            fontSize: 10,
                            fontWeight: 500,
                            letterSpacing: '0.14em',
                            color: 'hsl(var(--ds-fg-3))',
                            fontVariantNumeric: 'tabular-nums',
                            minWidth: 32,
                          }}
                        >
                          {pct}%
                        </span>
                        <span
                          style={{
                            flex: 1,
                            height: 3,
                            background: 'hsl(var(--ds-line-2) / 0.6)',
                            position: 'relative',
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: `${pct}%`,
                              background: 'hsl(var(--ds-accent))',
                              transition: 'width 200ms',
                            }}
                          />
                        </span>
                        <span
                          style={{
                            fontFamily: '"HN Display", sans-serif',
                            fontSize: 10,
                            fontWeight: 500,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            color: 'hsl(var(--ds-fg-3))',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {done} de {total} concluídas
                        </span>
                      </div>
                    );
                  })()}
                </>
              ) : null}
              {task.subtasks && task.subtasks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {task.subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="group"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: 8,
                        transition: 'background 150ms',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Checkbox
                        checked={subtask.is_completed}
                        onCheckedChange={(checked) =>
                          updateSubtask.mutateAsync({
                            id: subtask.id,
                            updates: { is_completed: checked as boolean },
                            subtaskTitle: subtask.title
                          })
                        }
                        disabled={updateSubtask.isPending}
                        className="data-[state=checked]:bg-[hsl(var(--ds-success))] data-[state=checked]:border-[hsl(var(--ds-success))] data-[state=checked]:text-white"
                      />
                      <span
                        className={cn(
                          "flex-1 text-sm",
                          subtask.is_completed && "line-through"
                        )}
                        style={{
                          color: subtask.is_completed ? 'hsl(var(--ds-fg-3))' : 'hsl(var(--ds-fg-1))',
                        }}
                      >
                        {subtask.title}
                      </span>
                      <button
                        type="button"
                        className="btn opacity-0 group-hover:opacity-100"
                        style={{
                          width: 28,
                          height: 28,
                          padding: 0,
                          justifyContent: 'center',
                          color: 'hsl(var(--ds-fg-3))',
                        }}
                        onClick={() => deleteSubtask.mutateAsync({ id: subtask.id, title: subtask.title })}
                        disabled={deleteSubtask.isPending}
                      >
                        <Trash2 size={13} strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={CheckSquare} title="Nenhuma subtarefa" description="Nenhuma subtarefa." compact />
              )}

              <form onSubmit={handleAddSubtask} style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid hsl(var(--ds-line-1))' }}>
                  <Input
                    placeholder="Adicionar subtarefa..."
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    className="h-9 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <button
                    type="submit"
                    className="btn"
                    style={{ height: 28, marginRight: 4, padding: '0 8px', justifyContent: 'center' }}
                    disabled={addSubtask.isPending || !newSubtask.trim()}
                  >
                    <Plus size={13} strokeWidth={1.5} />
                  </button>
                </div>
              </form>
            </div>

            <div style={sepStyle} />

            {/* Seção: Comentários */}
            <div>
              <h3 style={sectionHeader}>
                Comentários <span style={{ fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--ds-fg-3))', fontWeight: 400 }}>({task.comments.length})</span>
              </h3>
              {task.comments && task.comments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid hsl(var(--ds-line-1))' }}>
                  {task.comments.map((comment) => (
                    <CommentRow
                      key={comment.id}
                      comment={comment}
                      onDelete={() => deleteComment.mutateAsync(comment.id)}
                      onReply={() => setReplyingTo(comment)}
                      isDeleting={deleteComment.isPending}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState icon={MessageCircle} title="Nenhum comentário" description="Nenhum comentário." compact />
              )}

              {/* Reply box */}
              <form onSubmit={handleAddComment} style={{ marginTop: 18 }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '32px 1fr',
                    gap: 14,
                    alignItems: 'flex-start',
                  }}
                >
                  <Avatar className="rounded-none [&_img]:rounded-none [&_span]:rounded-none" style={{ width: 32, height: 32, borderRadius: 0 }}>
                    {currentUserAvatar ? <AvatarImage src={currentUserAvatar} /> : null}
                    <AvatarFallback className="rounded-none" style={{ fontSize: 10, borderRadius: 0 }}>
                      {(currentUserName || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      border: '1px solid hsl(var(--ds-line-1))',
                      background: 'hsl(var(--ds-bg, var(--ds-surface)))',
                    }}
                  >
                    {replyingTo ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 12px',
                          borderBottom: '1px solid hsl(var(--ds-line-1))',
                          background: 'hsl(var(--ds-line-2) / 0.3)',
                          fontSize: 12,
                          color: 'hsl(var(--ds-fg-3))',
                          minWidth: 0,
                        }}
                      >
                        <span style={{ fontFamily: '"HN Display", sans-serif', fontWeight: 500, color: 'hsl(var(--ds-fg-2))' }}>
                          Em resposta a {replyingTo.user_name || 'comentário'}:
                        </span>
                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontStyle: 'italic',
                          }}
                        >
                          {replyingTo.content.slice(0, 80)}{replyingTo.content.length > 80 ? '…' : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => setReplyingTo(null)}
                          style={{
                            background: 'transparent',
                            border: 0,
                            padding: 0,
                            cursor: 'pointer',
                            color: 'hsl(var(--ds-fg-4))',
                            fontSize: 11,
                          }}
                          title="Cancelar resposta"
                          aria-label="Cancelar resposta"
                        >
                          ✕
                        </button>
                      </div>
                    ) : null}

                    <MentionTextarea
                      value={newComment}
                      onChange={setNewComment}
                      users={users.map((u: any) => ({
                        id: u.id,
                        display_name: u.display_name ?? null,
                        email: u.email,
                        avatar_url: u.avatar_url ?? null,
                      }))}
                      placeholder={
                        replyingTo
                          ? 'Sua resposta… use @ para mencionar alguém'
                          : 'Escreva um comentário… use @ para mencionar alguém'
                      }
                      rows={3}
                      className="resize-y border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      style={{ minHeight: 84, padding: '12px 14px', background: 'transparent', fontSize: 14 }}
                      onSubmit={handleSubmitComment}
                    />

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '6px 8px',
                        borderTop: '1px solid hsl(var(--ds-line-1))',
                        background: 'hsl(var(--ds-line-2) / 0.3)',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: 'hsl(var(--ds-fg-4))',
                          marginLeft: 4,
                        }}
                      >
                        Use <strong style={{ color: 'hsl(var(--ds-fg-2))' }}>@nome</strong> para mencionar
                      </span>
                      <button
                        type="submit"
                        disabled={addComment.isPending || !newComment.trim()}
                        style={{
                          marginLeft: 'auto',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          height: 28,
                          padding: '0 14px',
                          background: addComment.isPending || !newComment.trim() ? 'hsl(var(--ds-line-2))' : 'hsl(var(--ds-fg-1))',
                          color: 'hsl(var(--ds-bg))',
                          fontFamily: '"HN Display", sans-serif',
                          fontSize: 10,
                          fontWeight: 500,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          border: 0,
                          cursor: addComment.isPending || !newComment.trim() ? 'not-allowed' : 'pointer',
                          transition: 'background 120ms',
                        }}
                      >
                        <Send size={11} strokeWidth={1.5} />
                        <span>Enviar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div style={sepStyle} />

            {/* Seção: Anexos */}
            <div>
              <h3 style={{ ...sectionHeader, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Paperclip size={18} strokeWidth={1.5} />
                Anexos <span style={{ fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--ds-fg-3))', fontWeight: 400 }}>({task.attachments?.length || 0})</span>
              </h3>

              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={handleFilePick}
              />

              {/* Grid de file-cards (sempre presente; última card é o "Arrastar ou clicar") */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  border: '1px solid hsl(var(--ds-line-1))',
                }}
              >
                {task.attachments?.map((att, idx) => (
                  <FileCard
                    key={att.id}
                    fileName={att.file_name}
                    fileType={att.file_type}
                    fileSize={att.file_size}
                    createdAt={att.created_at}
                    onOpen={() => handleOpenAttachment(att.file_url)}
                    onDelete={() =>
                      deleteAttachment.mutateAsync({
                        id: att.id,
                        fileName: att.file_name,
                        fileUrl: att.file_url,
                      })
                    }
                    deleting={deleteAttachment.isPending}
                    last={idx === (task.attachments?.length ?? 0) - 1 && (task.attachments?.length ?? 0) % 2 === 1}
                  />
                ))}

                {/* Upload card (dashed) */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={addAttachment.isPending}
                  style={{
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    border: 0,
                    borderRight: '1px dashed hsl(var(--ds-line-2))',
                    borderBottom: '1px dashed hsl(var(--ds-line-2))',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    minWidth: 0,
                    minHeight: 70,
                    transition: 'background 120ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    style={{
                      width: 36,
                      height: 46,
                      flexShrink: 0,
                      border: '1px dashed hsl(var(--ds-line-2))',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'hsl(var(--ds-fg-4))',
                    }}
                  >
                    {addAttachment.isPending ? (
                      <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />
                    ) : (
                      <Upload size={16} strokeWidth={1.5} />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: '"HN Display", sans-serif',
                        fontWeight: 500,
                        fontSize: 13,
                        color: 'hsl(var(--ds-fg-2))',
                      }}
                    >
                      {addAttachment.isPending ? 'Enviando…' : 'Arrastar ou clicar'}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'hsl(var(--ds-fg-4))',
                        fontFamily: '"HN Display", sans-serif',
                      }}
                    >
                      PDF, imagem, vídeo, doc — até 50 MB
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div style={sepStyle} />

            {/* Seção: Links Externos */}
            <div>
              <h3 style={{ ...sectionHeader, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link2 size={18} strokeWidth={1.5} />
                Links Externos <span style={{ fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--ds-fg-3))', fontWeight: 400 }}>({task.links?.length || 0})</span>
              </h3>

              {task.links && task.links.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid hsl(var(--ds-line-1))', marginBottom: 16 }}>
                  {task.links.map((link) => (
                    <LinkCard
                      key={link.id}
                      url={link.url}
                      title={link.title}
                      linkType={link.link_type}
                      onDelete={() => deleteLink.mutateAsync({ id: link.id, title: link.title })}
                      deleting={deleteLink.isPending}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState icon={Link2} title="Nenhum link externo" description="Nenhum link externo." compact />
              )}

              <form onSubmit={handleAddLink} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ border: '1px solid hsl(var(--ds-line-1))' }}>
                  <Input
                    placeholder="https://drive.google.com/..."
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className="h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, border: '1px solid hsl(var(--ds-line-1))' }}>
                    <Input
                      placeholder="Título do link (ex: Briefing do projeto)"
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      className="h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn primary"
                    style={{ height: 40, padding: '0 16px' }}
                    disabled={addLink.isPending || !newLinkUrl.trim() || !newLinkTitle.trim()}
                  >
                    <Plus size={13} strokeWidth={1.5} />
                    <span>Adicionar</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Histórico de Ações */}
        <TaskHistorySection taskId={task.id} taskCreatedAt={task.created_at} />
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <span style={{ fontFamily: '"HN Display", sans-serif' }}>Excluir tarefa?</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A tarefa e todos os seus dados (subtarefas, comentários, anexos) serão permanentemente excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              style={{ background: 'hsl(var(--ds-danger))', color: 'white' }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helper: comment row with avatar + role + @mention highlighting
// ─────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<NonNullable<TaskComment['role']>, string> = {
  solicitante: 'Solicitante',
  responsavel: 'Responsável',
  colaborador: 'Colaborador',
};

function renderCommentContent(text: string): React.ReactNode[] {
  // Split on @word patterns and render mentions in accent color
  const parts: React.ReactNode[] = [];
  const re = /@([\p{L}0-9_.-]+)/gu;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span
        key={key++}
        style={{
          color: 'hsl(var(--ds-info))',
          fontFamily: '"HN Display", sans-serif',
          fontWeight: 500,
        }}
      >
        @{match[1]}
      </span>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

interface CommentRowProps {
  comment: TaskComment;
  onDelete: () => void;
  onReply: () => void;
  isDeleting: boolean;
}

function CommentRow({ comment, onDelete, onReply, isDeleting }: CommentRowProps) {
  const initials = (comment.user_name ?? 'U').charAt(0).toUpperCase();
  const roleLabel = comment.role ? ROLE_LABEL[comment.role] : null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr',
        gap: 14,
        padding: '18px 4px',
        borderBottom: '1px solid hsl(var(--ds-line-1))',
      }}
    >
      <Avatar className="rounded-none [&_img]:rounded-none [&_span]:rounded-none" style={{ width: 32, height: 32, borderRadius: 0 }}>
        {comment.avatar_url ? <AvatarImage src={comment.avatar_url} /> : null}
        <AvatarFallback className="rounded-none" style={{ fontSize: 10, borderRadius: 0 }}>{initials}</AvatarFallback>
      </Avatar>

      <div style={{ minWidth: 0 }}>
        {comment.parent_snippet ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 8,
              padding: '6px 10px',
              borderLeft: '2px solid hsl(var(--ds-line-2))',
              fontSize: 12,
              color: 'hsl(var(--ds-fg-3))',
              fontStyle: 'italic',
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontStyle: 'normal',
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'hsl(var(--ds-fg-4))',
                flexShrink: 0,
              }}
            >
              ↳ Em resposta a {comment.parent_snippet.user_name || 'comentário'}:
            </span>
            <span
              style={{
                flex: 1,
                minWidth: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {comment.parent_snippet.content_preview}
              {comment.parent_snippet.content_preview.length >= 120 ? '…' : ''}
            </span>
          </div>
        ) : null}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 10,
            marginBottom: 6,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: '"HN Display", sans-serif',
              fontWeight: 500,
              fontSize: 13,
              color: 'hsl(var(--ds-fg-1))',
            }}
          >
            {comment.user_name || 'Usuário'}
          </span>
          {roleLabel ? (
            <span
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'hsl(var(--ds-fg-4))',
              }}
            >
              {roleLabel}
            </span>
          ) : null}
          <span
            style={{
              fontFamily: '"HN Display", sans-serif',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'hsl(var(--ds-fg-4))',
              marginLeft: 'auto',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {format(new Date(comment.created_at), "dd MMM · HH:mm", { locale: ptBR })}
          </span>
        </div>

        <div
          style={{
            fontSize: 14,
            color: 'hsl(var(--ds-fg-2))',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}
        >
          {renderCommentContent(comment.content)}
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
          <button
            type="button"
            onClick={onReply}
            style={{
              fontFamily: '"HN Display", sans-serif',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'hsl(var(--ds-fg-4))',
              background: 'transparent',
              border: 0,
              cursor: 'pointer',
              padding: 0,
              transition: 'color 120ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--ds-fg-1))')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--ds-fg-4))')}
          >
            Responder
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            style={{
              fontFamily: '"HN Display", sans-serif',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'hsl(var(--ds-fg-4))',
              background: 'transparent',
              border: 0,
              cursor: 'pointer',
              padding: 0,
              transition: 'color 120ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--ds-danger))')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--ds-fg-4))')}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// FileCard — anexo com ícone colorido por extensão
// ─────────────────────────────────────────────────────────────────

function extColorFromName(name: string, mime?: string | null): { tone: string; ext: string } {
  const dot = name.lastIndexOf('.');
  const rawExt = dot > 0 ? name.slice(dot + 1).toUpperCase() : (mime?.split('/')?.[1] ?? 'FILE').toUpperCase();
  const ext = rawExt.length > 4 ? rawExt.slice(0, 4) : rawExt;

  // tone: 'default' | 'pdf' (red) | 'video' (blue) | 'image' (info) | 'doc' (info)
  const lower = ext.toLowerCase();
  if (lower === 'pdf') return { tone: 'pdf', ext };
  if (['mov', 'mp4', 'avi', 'mkv', 'webm'].includes(lower)) return { tone: 'video', ext };
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(lower)) return { tone: 'image', ext };
  if (['doc', 'docx', 'txt', 'rtf', 'odt', 'md'].includes(lower)) return { tone: 'doc', ext };
  return { tone: 'default', ext };
}

function formatBytesShort(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileCardProps {
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  createdAt: string;
  onOpen: () => void;
  onDelete: () => void;
  deleting: boolean;
  last: boolean;
}

function FileCard({ fileName, fileType, fileSize, createdAt, onOpen, onDelete, deleting, last }: FileCardProps) {
  const { tone, ext } = extColorFromName(fileName, fileType);
  const toneStyles: Record<string, { bg: string; border: string; color: string }> = {
    default: {
      bg: 'hsl(var(--ds-line-2) / 0.5)',
      border: 'hsl(var(--ds-line-2))',
      color: 'hsl(var(--ds-fg-2))',
    },
    pdf: {
      bg: 'hsl(var(--ds-danger) / 0.08)',
      border: 'hsl(var(--ds-danger) / 0.25)',
      color: 'hsl(var(--ds-danger))',
    },
    video: {
      bg: 'hsl(var(--ds-info) / 0.08)',
      border: 'hsl(var(--ds-info) / 0.25)',
      color: 'hsl(var(--ds-info))',
    },
    image: {
      bg: 'hsl(var(--ds-info) / 0.08)',
      border: 'hsl(var(--ds-info) / 0.25)',
      color: 'hsl(var(--ds-info))',
    },
    doc: {
      bg: 'hsl(var(--ds-line-2) / 0.5)',
      border: 'hsl(var(--ds-line-2))',
      color: 'hsl(var(--ds-fg-2))',
    },
  };
  const t = toneStyles[tone];

  return (
    <div
      className="group"
      style={{
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderRight: last ? 0 : '1px solid hsl(var(--ds-line-1))',
        borderBottom: '1px solid hsl(var(--ds-line-1))',
        background: 'transparent',
        cursor: 'pointer',
        transition: 'background 120ms',
        minWidth: 0,
        minHeight: 70,
      }}
      onClick={onOpen}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Icon */}
      <div
        style={{
          width: 36,
          height: 46,
          flexShrink: 0,
          background: t.bg,
          border: '1px solid ' + t.border,
          display: 'grid',
          placeItems: 'center',
          position: 'relative',
        }}
      >
        <span
          style={{
            fontFamily: '"HN Display", sans-serif',
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.06em',
            color: t.color,
          }}
        >
          {ext}
        </span>
        {/* Corner fold */}
        <span
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 0,
            height: 0,
            borderStyle: 'solid',
            borderWidth: '0 7px 7px 0',
            borderColor: 'transparent hsl(var(--ds-bg, var(--ds-surface))) transparent transparent',
          }}
        />
      </div>

      {/* Meta */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontFamily: '"HN Display", sans-serif',
            fontWeight: 500,
            fontSize: 13,
            color: 'hsl(var(--ds-fg-1))',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {fileName}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'hsl(var(--ds-fg-4))',
            fontFamily: '"HN Display", sans-serif',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {[
            fileType,
            formatBytesShort(fileSize),
            format(new Date(createdAt), 'dd/MM', { locale: ptBR }),
          ]
            .filter(Boolean)
            .join(' · ')}
        </div>
      </div>

      {/* Delete on hover */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        disabled={deleting}
        className="opacity-0 group-hover:opacity-100"
        style={{
          width: 28,
          height: 28,
          padding: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'hsl(var(--ds-fg-3))',
          background: 'transparent',
          border: 0,
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'color 120ms, opacity 120ms',
        }}
        title="Remover anexo"
        aria-label="Remover anexo"
      >
        <Trash2 size={14} strokeWidth={1.5} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// LinkCard — link externo com favicon
// ─────────────────────────────────────────────────────────────────

const LINK_FAVI_BY_TYPE: Record<string, { letter: string; bg: string; border: string; color: string }> = {
  google_drive: {
    letter: 'G',
    bg: 'hsl(var(--ds-success) / 0.1)',
    border: 'hsl(var(--ds-success) / 0.3)',
    color: 'hsl(var(--ds-success))',
  },
  dropbox: {
    letter: 'D',
    bg: 'hsl(var(--ds-info) / 0.1)',
    border: 'hsl(var(--ds-info) / 0.3)',
    color: 'hsl(var(--ds-info))',
  },
  notion: {
    letter: 'N',
    bg: 'hsl(var(--ds-line-2) / 0.5)',
    border: 'hsl(var(--ds-line-2))',
    color: 'hsl(var(--ds-fg-1))',
  },
  onedrive: {
    letter: 'O',
    bg: 'hsl(var(--ds-info) / 0.1)',
    border: 'hsl(var(--ds-info) / 0.3)',
    color: 'hsl(var(--ds-info))',
  },
  other: {
    letter: '?',
    bg: 'hsl(var(--ds-line-2) / 0.5)',
    border: 'hsl(var(--ds-line-2))',
    color: 'hsl(var(--ds-fg-2))',
  },
};

function getDomainShort(url: string): string {
  try {
    const u = new URL(url);
    return u.host.replace('www.', '') + (u.pathname !== '/' ? u.pathname : '');
  } catch {
    return url;
  }
}

interface LinkCardProps {
  url: string;
  title: string;
  linkType: TaskLinkType;
  onDelete: () => void;
  deleting: boolean;
}

function LinkCard({ url, title, linkType, onDelete, deleting }: LinkCardProps) {
  const favi = LINK_FAVI_BY_TYPE[linkType] ?? LINK_FAVI_BY_TYPE.other;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group"
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr auto auto',
        gap: 14,
        alignItems: 'center',
        padding: '14px 4px',
        borderBottom: '1px solid hsl(var(--ds-line-1))',
        transition: 'background 120ms',
        textDecoration: 'none',
        color: 'inherit',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div
        style={{
          width: 28,
          height: 28,
          background: favi.bg,
          border: '1px solid ' + favi.border,
          display: 'grid',
          placeItems: 'center',
          fontFamily: '"HN Display", sans-serif',
          fontSize: 12,
          fontWeight: 500,
          color: favi.color,
        }}
      >
        {favi.letter}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: '"HN Display", sans-serif',
            fontWeight: 500,
            fontSize: 13,
            color: 'hsl(var(--ds-fg-1))',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 11,
            color: 'hsl(var(--ds-fg-4))',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {getDomainShort(url)}
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
        disabled={deleting}
        className="opacity-0 group-hover:opacity-100"
        style={{
          width: 28,
          height: 28,
          padding: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'hsl(var(--ds-fg-3))',
          background: 'transparent',
          border: 0,
          cursor: 'pointer',
          transition: 'color 120ms, opacity 120ms',
        }}
        title="Remover link"
        aria-label="Remover link"
      >
        <Trash2 size={14} strokeWidth={1.5} />
      </button>
      <ExternalLink size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-4))' }} />
    </a>
  );
}
