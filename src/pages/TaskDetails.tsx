import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Trash2, Plus, Send, Link2, ExternalLink, HardDrive, Cloud, FileText, CheckSquare, MessageCircle, Paperclip, Download, Upload, Loader2, Folder, ArrowLeft } from 'lucide-react';
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
import { TaskHistorySection } from '@/features/tasks/components/TaskHistorySection';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { useUsers } from '@/hooks/useUsers';
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
    await addComment.mutateAsync(newComment);
    setNewComment('');
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {/* Top row: back link + actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <button
            type="button"
            className="btn"
            onClick={() => navigate('/tarefas')}
            style={{ padding: '4px 10px', fontSize: 12 }}
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            <span>Voltar para tarefas</span>
          </button>
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

        {/* Eyebrow: projeto chip */}
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
              width: 'fit-content',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--ds-fg-1))')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--ds-fg-3))')}
          >
            <span style={{ width: 8, height: 8, background: projectDotColor, flexShrink: 0 }} />
            <span style={{ fontFamily: '"HN Display", sans-serif', fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
              {task.project_name}
            </span>
          </button>
        ) : null}

        {/* Title (inline-editable) */}
        <div>
          <InlineEditCell
            value={task.title}
            onSave={(newTitle) => handleUpdateTask({ title: newTitle })}
            className="text-3xl font-bold"
          />
        </div>

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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {task.comments.map((comment) => (
                    <div
                      key={comment.id}
                      style={{
                        borderLeft: '2px solid hsl(var(--ds-accent) / 0.3)',
                        paddingLeft: 16,
                        paddingTop: 4,
                        paddingBottom: 4,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ fontWeight: 500, fontSize: 13, color: 'hsl(var(--ds-fg-1))' }}>{comment.user_name || 'Usuário'}</p>
                          <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
                            {format(new Date(comment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            width: 28,
                            height: 28,
                            padding: 0,
                            justifyContent: 'center',
                            color: 'hsl(var(--ds-fg-3))',
                          }}
                          onClick={() => deleteComment.mutateAsync(comment.id)}
                          disabled={deleteComment.isPending}
                        >
                          <Trash2 size={13} strokeWidth={1.5} />
                        </button>
                      </div>
                      <p style={{ marginTop: 8, fontSize: 13, whiteSpace: 'pre-wrap', color: 'hsl(var(--ds-fg-1))' }}>
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={MessageCircle} title="Nenhum comentário" description="Nenhum comentário." compact />
              )}

              <form onSubmit={handleAddComment} style={{ marginTop: 12 }}>
                <div style={{ position: 'relative', border: '1px solid hsl(var(--ds-line-1))' }}>
                  <Textarea
                    placeholder="Adicionar comentário..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={2}
                    className="resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pb-10"
                  />
                  <div style={{ position: 'absolute', bottom: 8, right: 8 }}>
                    <button
                      type="submit"
                      className="btn"
                      style={{ height: 28, padding: '0 8px', justifyContent: 'center' }}
                      disabled={addComment.isPending || !newComment.trim()}
                    >
                      <Send size={13} strokeWidth={1.5} />
                    </button>
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

              {task.attachments && task.attachments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {task.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="group"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: 12,
                        border: '1px solid hsl(var(--ds-line-1))',
                        transition: 'background 150ms',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <FileText size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleOpenAttachment(att.file_url)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontWeight: 500,
                            fontSize: 13,
                            color: 'hsl(var(--ds-fg-1))',
                            textAlign: 'left',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                        >
                          {att.file_name}
                          <Download size={11} strokeWidth={1.5} style={{ opacity: 0.5 }} />
                        </button>
                        <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
                          {formatBytes(att.file_size || 0)}
                          {att.file_type ? ` · ${att.file_type}` : ''}
                          {' · '}
                          {format(new Date(att.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
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
                        onClick={() => deleteAttachment.mutateAsync({ id: att.id, fileName: att.file_name, fileUrl: att.file_url })}
                        disabled={deleteAttachment.isPending}
                        title="Remover anexo"
                      >
                        <Trash2 size={13} strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Paperclip} title="Nenhum anexo" description="Anexe arquivos relacionados à tarefa." compact />
              )}

              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={handleFilePick}
              />
              <button
                type="button"
                className="btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={addAttachment.isPending}
                style={{ marginTop: 12 }}
              >
                {addAttachment.isPending ? (
                  <>
                    <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
                    <span>Enviando…</span>
                  </>
                ) : (
                  <>
                    <Upload size={13} strokeWidth={1.5} />
                    <span>Anexar arquivo</span>
                  </>
                )}
              </button>
              <p style={{ marginTop: 6, fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
                Máx. 50 MB por arquivo. PDF, imagem, vídeo, doc — tudo aceito.
              </p>
            </div>

            <div style={sepStyle} />

            {/* Seção: Links Externos */}
            <div>
              <h3 style={{ ...sectionHeader, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link2 size={18} strokeWidth={1.5} />
                Links Externos <span style={{ fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--ds-fg-3))', fontWeight: 400 }}>({task.links?.length || 0})</span>
              </h3>

              {task.links && task.links.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {task.links.map((link) => (
                    <div
                      key={link.id}
                      className="group"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: 12,
                        border: '1px solid hsl(var(--ds-line-1))',
                        transition: 'background 150ms',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {getLinkIcon(link.link_type)}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontWeight: 500,
                            fontSize: 13,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            color: 'hsl(var(--ds-fg-1))',
                            textDecoration: 'none',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                        >
                          {link.title}
                          <ExternalLink size={11} strokeWidth={1.5} style={{ opacity: 0.5 }} />
                        </a>
                        <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getDomain(link.url)}
                        </p>
                      </div>
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
                        onClick={() => deleteLink.mutateAsync({ id: link.id, title: link.title })}
                        disabled={deleteLink.isPending}
                      >
                        <Trash2 size={13} strokeWidth={1.5} />
                      </button>
                    </div>
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
