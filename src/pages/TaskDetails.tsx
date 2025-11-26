import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Calendar, User, Tag, Edit2, Trash2, Users, Plus, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTaskDetails } from '@/features/tasks/hooks/useTaskDetails';
import { useTaskMutations } from '@/features/tasks/hooks/useTaskMutations';
import { PriorityBadge } from '@/features/tasks/components/PriorityBadge';
import { StatusBadge } from '@/features/tasks/components/StatusBadge';
import { TaskDialog } from '@/features/tasks/components/TaskDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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

export default function TaskDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');

  const { task, isLoading, addSubtask, updateSubtask, deleteSubtask, addComment, deleteComment } = useTaskDetails(id!);
  const { deleteTask } = useTaskMutations();

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

  return (
    <div className="container mx-auto p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/tarefas')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{task.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Criada em {format(new Date(task.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Editar
          </Button>
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Status */}
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="w-fit">
                  <StatusBadge status={task.status} />
                </div>
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Prioridade</span>
                <div className="w-fit">
                  <PriorityBadge priority={task.priority} />
                </div>
              </div>

              {/* Created Date */}
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Criada em</span>
                <span className="text-sm font-medium">
                  {format(new Date(task.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>

              {/* Due Date */}
              {task.due_date && (
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Prazo</span>
                  <span className="text-sm font-medium">
                    {format(new Date(task.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
              )}

              {/* Department */}
              {task.department && (
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Departamento</span>
                  <span className="text-sm font-medium">{task.department}</span>
                </div>
              )}

              {/* Responsável */}
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Responsável</span>
                {task.is_team_task ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Time Hiro</span>
                  </div>
                ) : task.assignee_name ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={task.assignee_avatar || undefined} />
                      <AvatarFallback className="text-xs">{task.assignee_name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate">{task.assignee_name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Não atribuída</span>
                )}
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
              {task.description ? (
                <p className="whitespace-pre-wrap text-sm">{task.description}</p>
              ) : (
                <p className="text-muted-foreground italic text-sm">Sem descrição</p>
              )}
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
                            updates: { is_completed: checked as boolean }
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
                        onClick={() => deleteSubtask.mutateAsync(subtask.id)}
                        disabled={deleteSubtask.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Nenhuma subtarefa</p>
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
                <p className="text-muted-foreground text-sm">Nenhum comentário</p>
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
          </CardContent>
        </Card>
      </div>

      <TaskDialog open={editOpen} onOpenChange={setEditOpen} task={task} />

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
