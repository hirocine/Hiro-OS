import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Trash2, Plus, Send, Link2, ExternalLink, HardDrive, Cloud, FileText, CheckSquare, MessageCircle } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

export default function TaskDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [description, setDescription] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');

  const { task, isLoading, addSubtask, updateSubtask, deleteSubtask, addComment, deleteComment, addLink, deleteLink } = useTaskDetails(id!);
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

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
      <BreadcrumbNav
        items={[
          { label: 'Tarefas', href: '/tarefas' },
          { label: task.title },
        ]}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <InlineEditCell
            value={task.title}
            onSave={(newTitle) => handleUpdateTask({ title: newTitle })}
            className="text-3xl font-bold"
          />
          <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
            Criada em {format(new Date(task.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Details Card */}
        <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid hsl(var(--ds-line-1))', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'hsl(var(--ds-fg-2))' }}>
              Detalhes
            </span>
          </div>
          <div style={{ padding: 18 }}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={eyebrow}>Status</span>
                <InlineSelectCell
                  value={task.status}
                  options={statusOptions}
                  onSave={(newStatus) => handleUpdateTask({ status: newStatus as TaskStatus })}
                  renderValue={(val) => <StatusBadge status={val as TaskStatus} />}
                  renderOption={(val) => <StatusBadge status={val as TaskStatus} />}
                />
              </div>

              {/* Priority */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={eyebrow}>Prioridade</span>
                <InlineSelectCell
                  value={task.priority}
                  options={priorityOptions}
                  onSave={(newPriority) => handleUpdateTask({ priority: newPriority as TaskPriority })}
                  renderValue={(val) => <PriorityBadge priority={val as TaskPriority} />}
                  renderOption={(val) => <PriorityBadge priority={val as TaskPriority} />}
                />
              </div>

              {/* Due Date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={eyebrow}>Prazo</span>
                <InlineDateCell
                  value={task.due_date}
                  onSave={(newDate) => handleUpdateTask({ due_date: newDate })}
                />
              </div>

              {/* Department */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={eyebrow}>Departamento</span>
                <InlineDepartmentCell
                  value={task.department}
                  departments={departments}
                  onSave={(newDept) => handleUpdateTask({ department: newDept })}
                />
              </div>

              {/* Responsável */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={eyebrow}>Responsável</span>
                <InlineAssigneeCell
                  value={task.assignees?.map(a => a.user_id) || (task.assigned_to ? [task.assigned_to] : [])}
                  users={users}
                  onSave={(newAssignees) => updateAssignees.mutate({ taskId: task.id, assigneeIds: newAssignees })}
                />
              </div>
            </div>
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
