import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Calendar, User, Tag, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTaskDetails } from '@/features/tasks/hooks/useTaskDetails';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { PriorityBadge } from '@/features/tasks/components/PriorityBadge';
import { StatusBadge } from '@/features/tasks/components/StatusBadge';
import { TaskDialog } from '@/features/tasks/components/TaskDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  const { deleteTask } = useTasks();

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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Status */}
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={task.status} />
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Prioridade</span>
                <PriorityBadge priority={task.priority} />
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

              {/* Assignee */}
              {task.assignee_name && (
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Responsável</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={task.assignee_avatar || undefined} />
                      <AvatarFallback className="text-xs">{task.assignee_name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate">{task.assignee_name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Team Task Indicator */}
            {task.is_team_task && (
              <div className="mt-4 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  ✓ Tarefa do time (visível para todos)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            {task.description ? (
              <p className="whitespace-pre-wrap">{task.description}</p>
            ) : (
              <p className="text-muted-foreground italic">Sem descrição</p>
            )}
          </CardContent>
        </Card>

        {/* Subtasks */}
        <Card>
          <CardHeader>
            <CardTitle>Subtarefas ({task.subtasks.filter(s => s.is_completed).length}/{task.subtasks.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {task.subtasks.map((subtask) => (
              <div key={subtask.id} className="flex items-center gap-2">
                <Checkbox
                  checked={subtask.is_completed}
                  onCheckedChange={(checked) =>
                    updateSubtask.mutateAsync({ id: subtask.id, updates: { is_completed: !!checked } })
                  }
                />
                <span className={subtask.is_completed ? 'line-through text-muted-foreground' : ''}>
                  {subtask.title}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteSubtask.mutateAsync(subtask.id)}
                  className="ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            
            <form onSubmit={handleAddSubtask} className="flex gap-2 mt-4">
              <Input
                placeholder="Adicionar subtarefa..."
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
              />
              <Button type="submit" disabled={addSubtask.isPending}>
                Adicionar
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Comments */}
        <Card>
          <CardHeader>
            <CardTitle>Comentários ({task.comments.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {task.comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>{comment.user_name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.user_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{comment.content}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteComment.mutateAsync(comment.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            
            <form onSubmit={handleAddComment} className="flex flex-col gap-2 mt-4">
              <Textarea
                placeholder="Adicionar comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <Button type="submit" disabled={addComment.isPending} className="self-end">
                Comentar
              </Button>
            </form>
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
