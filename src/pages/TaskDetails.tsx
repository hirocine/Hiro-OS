import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Trash2, Plus, Send, Link2, ExternalLink, HardDrive, Cloud, FileText, CheckSquare, MessageCircle } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
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
      return <HardDrive className="w-4 h-4 text-blue-500" />;
    case 'dropbox':
      return <Cloud className="w-4 h-4 text-blue-600" />;
    case 'notion':
      return <FileText className="w-4 h-4 text-foreground" />;
    case 'onedrive':
      return <Cloud className="w-4 h-4 text-sky-500" />;
    default:
      return <Link2 className="w-4 h-4 text-muted-foreground" />;
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
      <div className="container mx-auto p-6 md:p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto p-6 md:p-8">
        <p className="text-muted-foreground">Tarefa não encontrada</p>
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
    <div className="container mx-auto p-6 md:p-8">
      <BreadcrumbNav 
        items={[
          { label: 'Tarefas', href: '/tarefas' },
          { label: task.title }
        ]} 
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <InlineEditCell
            value={task.title}
            onSave={(newTitle) => handleUpdateTask({ title: newTitle })}
            className="text-3xl font-bold"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Criada em {format(new Date(task.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Status */}
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Status</span>
                <InlineSelectCell
                  value={task.status}
                  options={statusOptions}
                  onSave={(newStatus) => handleUpdateTask({ status: newStatus as TaskStatus })}
                  renderValue={(val) => <StatusBadge status={val as TaskStatus} />}
                  renderOption={(val) => <StatusBadge status={val as TaskStatus} />}
                />
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Prioridade</span>
                <InlineSelectCell
                  value={task.priority}
                  options={priorityOptions}
                  onSave={(newPriority) => handleUpdateTask({ priority: newPriority as TaskPriority })}
                  renderValue={(val) => <PriorityBadge priority={val as TaskPriority} />}
                  renderOption={(val) => <PriorityBadge priority={val as TaskPriority} />}
                />
              </div>

              {/* Due Date */}
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Prazo</span>
                <InlineDateCell
                  value={task.due_date}
                  onSave={(newDate) => handleUpdateTask({ due_date: newDate })}
                />
              </div>

              {/* Department */}
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Departamento</span>
                <InlineDepartmentCell
                  value={task.department}
                  departments={departments}
                  onSave={(newDept) => handleUpdateTask({ department: newDept })}
                />
              </div>

              {/* Responsável */}
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Responsável</span>
                <InlineAssigneeCell
                  value={task.assignees?.map(a => a.user_id) || (task.assigned_to ? [task.assigned_to] : [])}
                  users={users}
                  onSave={(newAssignees) => updateAssignees.mutate({ taskId: task.id, assigneeIds: newAssignees })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unified Content Card */}
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Seção: Descrição */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Descrição</h3>
              <div className="relative border rounded-md focus-within:ring-1 focus-within:ring-ring">
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

            <Separator />

            {/* Seção: Subtarefas */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Subtarefas ({task.subtasks.filter(s => s.is_completed).length}/{task.subtasks.length})
              </h3>
              {task.subtasks && task.subtasks.length > 0 ? (
                <div className="space-y-2">
                  {task.subtasks.map((subtask) => (
                    <div 
                      key={subtask.id} 
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 group transition-colors"
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
                      <span className={cn(
                        "flex-1 text-sm",
                        subtask.is_completed && "line-through text-muted-foreground"
                      )}>
                        {subtask.title}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        onClick={() => deleteSubtask.mutateAsync({ id: subtask.id, title: subtask.title })}
                        disabled={deleteSubtask.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={CheckSquare} title="Nenhuma subtarefa" description="Nenhuma subtarefa." compact />
              )}

              <form onSubmit={handleAddSubtask} className="mt-3">
                <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-ring">
                  <Input
                    placeholder="Adicionar subtarefa..."
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    className="h-9 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Button 
                    type="submit" 
                    variant="ghost" 
                    size="sm"
                    className="h-7 mr-1 px-2"
                    disabled={addSubtask.isPending || !newSubtask.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </div>

            <Separator />

            {/* Seção: Comentários */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Comentários ({task.comments.length})</h3>
              {task.comments && task.comments.length > 0 ? (
                <div className="space-y-4">
                  {task.comments.map((comment) => (
                    <div key={comment.id} className="border-l-2 border-primary/20 pl-4 py-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{comment.user_name || 'Usuário'}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(comment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteComment.mutateAsync(comment.id)}
                          disabled={deleteComment.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="mt-2 text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={MessageCircle} title="Nenhum comentário" description="Nenhum comentário." compact />
              )}

              <form onSubmit={handleAddComment} className="mt-3">
                <div className="relative border rounded-md focus-within:ring-1 focus-within:ring-ring">
                  <Textarea
                    placeholder="Adicionar comentário..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={2}
                    className="resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pb-10"
                  />
                  <div className="absolute bottom-2 right-2">
                    <Button 
                      type="submit" 
                      variant="ghost" 
                      size="sm"
                      className="h-7 px-2"
                      disabled={addComment.isPending || !newComment.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            <Separator />

            {/* Seção: Links Externos */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Links Externos ({task.links?.length || 0})
              </h3>
              
              {task.links && task.links.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {task.links.map((link) => (
                    <div 
                      key={link.id} 
                      className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/50 group transition-colors"
                    >
                      {getLinkIcon(link.link_type)}
                      <div className="flex-1 min-w-0">
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-sm hover:underline flex items-center gap-1"
                        >
                          {link.title}
                          <ExternalLink className="w-3 h-3 opacity-50" />
                        </a>
                        <p className="text-xs text-muted-foreground truncate">
                          {getDomain(link.url)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        onClick={() => deleteLink.mutateAsync({ id: link.id, title: link.title })}
                        disabled={deleteLink.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Link2} title="Nenhum link externo" description="Nenhum link externo." compact />
              )}

              <form onSubmit={handleAddLink} className="space-y-3">
                <div className="border rounded-md focus-within:ring-1 focus-within:ring-ring">
                  <Input
                    placeholder="https://drive.google.com/..."
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className="h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 border rounded-md focus-within:ring-1 focus-within:ring-ring">
                    <Input
                      placeholder="Título do link (ex: Briefing do projeto)"
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      className="h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    size="default"
                    className="h-10 px-4"
                    disabled={addLink.isPending || !newLinkUrl.trim() || !newLinkTitle.trim()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Ações */}
        <TaskHistorySection taskId={task.id} taskCreatedAt={task.created_at} />
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A tarefa e todos os seus dados (subtarefas, comentários, anexos) serão permanentemente excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
