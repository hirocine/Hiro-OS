import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTaskMutations } from '../hooks/useTaskMutations';
import { Task, TaskStatus } from '../types';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';

interface TaskKanbanViewProps {
  tasks: Task[];
  isLoading?: boolean;
}

const COLUMNS: { status: TaskStatus; label: string; color: string; bgColor: string }[] = [
  { status: 'pendente', label: 'Pendente', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-800/50' },
  { status: 'em_progresso', label: 'Em Progresso', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  { status: 'concluida', label: 'Concluída', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  { status: 'arquivada', label: 'Arquivada', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20' },
];

const getDueInfo = (dueDate: string | null) => {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = dueDate.split('-').map(Number);
  const due = new Date(year, month - 1, day);
  const diff = differenceInDays(due, today);
  if (diff < 0) return { text: `${Math.abs(diff)}d atrasada`, isOverdue: true };
  if (diff === 0) return { text: 'Hoje', isOverdue: false };
  if (diff === 1) return { text: 'Amanhã', isOverdue: false };
  return { text: format(due, 'dd/MM', { locale: ptBR }), isOverdue: false };
};

function DroppableColumn({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(className, isOver && 'ring-2 ring-primary/30 bg-primary/5')}
    >
      {children}
    </div>
  );
}

function DraggableCard({ task, children }: { task: Task; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'touch-none',
        isDragging && 'opacity-30 scale-[0.98] transition-all'
      )}
    >
      {children}
    </div>
  );
}

export function TaskKanbanView({ tasks, isLoading }: TaskKanbanViewProps) {
  const navigate = useNavigate();
  const { createTask, updateTask } = useTaskMutations();
  const [quickAddColumn, setQuickAddColumn] = useState<TaskStatus | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      pendente: [], em_progresso: [], concluida: [], arquivada: [],
    };
    tasks.forEach(task => {
      if (grouped[task.status]) grouped[task.status].push(task);
    });
    return grouped;
  }, [tasks]);

  const handleQuickAdd = async (status: TaskStatus) => {
    if (!quickAddTitle.trim()) return;
    try {
      await createTask.mutateAsync({ title: quickAddTitle.trim(), status, priority: 'media', assignee_ids: [] });
      setQuickAddTitle('');
      setQuickAddColumn(null);
      toast.success('Tarefa criada!');
    } catch {
      toast.error('Erro ao criar tarefa');
    }
  };

  const handleMoveTask = async (task: Task, newStatus: TaskStatus) => {
    if (task.status === newStatus) return;
    await updateTask.mutateAsync({
      id: task.id,
      updates: { status: newStatus },
      oldTask: {
        title: task.title, status: task.status, priority: task.priority,
        due_date: task.due_date, department: task.department,
        assigned_to: task.assigned_to, description: task.description,
      },
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;
    const task = tasks.find(t => t.id === active.id);
    const newStatus = over.id as TaskStatus;
    if (task && task.status !== newStatus) {
      handleMoveTask(task, newStatus);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[500px]">
        {COLUMNS.map(column => {
          const columnTasks = tasksByStatus[column.status];
          return (
            <DroppableColumn key={column.status} id={column.status} className={cn('rounded-xl p-3 flex flex-col transition-all', column.bgColor)}>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className={cn('text-sm font-semibold', column.color)}>{column.label}</h3>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">{columnTasks.length}</Badge>
                </div>
                <button onClick={() => setQuickAddColumn(column.status)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-2 overflow-y-auto">
                {columnTasks.map(task => {
                  const dueInfo = getDueInfo(task.due_date);
                  return (
                    <DraggableCard key={task.id} task={task}>
                      <Card
                        onClick={() => navigate(`/tarefas/${task.id}`)}
                        className={cn(
                          'p-3 cursor-pointer hover:shadow-md transition-all hover:border-primary/30 group',
                          dueInfo?.isOverdue && task.status !== 'concluida' && 'border-l-4 border-l-destructive'
                        )}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-1.5 shrink-0",
                            task.priority === 'urgente' && "bg-red-500",
                            task.priority === 'alta' && "bg-orange-500",
                            task.priority === 'media' && "bg-yellow-500",
                            task.priority === 'baixa' && "bg-blue-500",
                            task.priority === 'standby' && "bg-gray-400",
                          )} />
                          <p className="text-sm font-medium leading-tight line-clamp-2">{task.title}</p>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            {task.assignees && task.assignees.length > 0 && (
                              <div className="flex -space-x-1.5">
                                {task.assignees.slice(0, 3).map(a => (
                                  <Avatar key={a.user_id} className="h-5 w-5 border border-background">
                                    <AvatarImage src={a.avatar_url || ''} />
                                    <AvatarFallback className="text-[10px]">{a.display_name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                                  </Avatar>
                                ))}
                                {task.assignees.length > 3 && (
                                  <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] border border-background">
                                    +{task.assignees.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                            {task.department && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0">{task.department}</Badge>
                            )}
                          </div>
                          {dueInfo && (
                            <span className={cn('flex items-center gap-0.5', dueInfo.isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
                              {dueInfo.isOverdue && <AlertTriangle className="h-3 w-3" />}
                              {dueInfo.text}
                            </span>
                          )}
                        </div>

                        {/* Move buttons on hover */}
                        <div className="flex sm:opacity-0 sm:group-hover:opacity-100 transition-opacity gap-1 mt-2 pt-2 border-t flex-wrap">
                          {COLUMNS.filter(c => c.status !== task.status).map(c => (
                            <Button
                              key={c.status}
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] px-2"
                              onClick={(e) => { e.stopPropagation(); handleMoveTask(task, c.status); }}
                            >
                              {c.label}
                            </Button>
                          ))}
                        </div>
                      </Card>
                    </DraggableCard>
                  );
                })}

                {/* Quick add input */}
                {quickAddColumn === column.status && (
                  <Card className="p-3">
                    <Input
                      autoFocus
                      placeholder="Título da tarefa..."
                      value={quickAddTitle}
                      onChange={e => setQuickAddTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleQuickAdd(column.status);
                        if (e.key === 'Escape') { setQuickAddColumn(null); setQuickAddTitle(''); }
                      }}
                      className="h-8 text-sm mb-2"
                    />
                    <div className="flex gap-1">
                      <Button size="sm" className="h-7 text-xs" onClick={() => handleQuickAdd(column.status)} disabled={!quickAddTitle.trim()}>Criar</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setQuickAddColumn(null); setQuickAddTitle(''); }}>Cancelar</Button>
                    </div>
                  </Card>
                )}

                {columnTasks.length === 0 && quickAddColumn !== column.status && (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    <p>Nenhuma tarefa</p>
                  </div>
                )}
              </div>
            </DroppableColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask && (
          <Card className="p-3 shadow-lg rotate-2 w-64 opacity-90">
            <div className="flex items-start gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full mt-1.5 shrink-0",
                activeTask.priority === 'urgente' && "bg-red-500",
                activeTask.priority === 'alta' && "bg-orange-500",
                activeTask.priority === 'media' && "bg-yellow-500",
                activeTask.priority === 'baixa' && "bg-blue-500",
                activeTask.priority === 'standby' && "bg-gray-400",
              )} />
              <p className="text-sm font-medium leading-tight line-clamp-2">{activeTask.title}</p>
            </div>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}
