import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
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

const COLUMNS: { status: TaskStatus; label: string; tone: string }[] = [
  { status: 'pendente', label: 'Pendente', tone: 'hsl(var(--ds-fg-3))' },
  { status: 'em_progresso', label: 'Em Progresso', tone: 'hsl(var(--ds-info))' },
  { status: 'concluida', label: 'Concluída', tone: 'hsl(var(--ds-success))' },
  { status: 'arquivada', label: 'Arquivada', tone: 'hsl(var(--ds-danger))' },
];

const priorityColor: Record<string, string> = {
  urgente: 'hsl(var(--ds-danger))',
  alta: 'hsl(var(--ds-warning))',
  media: 'hsl(var(--ds-warning))',
  baixa: 'hsl(var(--ds-info))',
  standby: 'hsl(var(--ds-fg-4))',
};

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

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        background: 'hsl(var(--ds-surface))',
        border: '1px solid hsl(var(--ds-line-1))',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isOver ? 'inset 0 0 0 1px hsl(var(--ds-accent))' : undefined,
        transition: 'box-shadow 0.15s',
      }}
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
      style={{
        touchAction: 'none',
        opacity: isDragging ? 0.3 : 1,
        transform: isDragging ? 'scale(0.98)' : undefined,
        transition: 'opacity 0.15s, transform 0.15s',
      }}
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      pendente: [], em_progresso: [], concluida: [], arquivada: [],
    };
    tasks.forEach((task) => {
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
        title: task.title,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date,
        department: task.department,
        assigned_to: task.assigned_to,
        description: task.description,
      },
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;
    const task = tasks.find((t) => t.id === active.id);
    const newStatus = over.id as TaskStatus;
    if (task && task.status !== newStatus) {
      handleMoveTask(task, newStatus);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, minHeight: 500 }}>
        {COLUMNS.map((column) => {
          const columnTasks = tasksByStatus[column.status];
          return (
            <DroppableColumn key={column.status} id={column.status}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: column.tone,
                    }}
                  />
                  <h3
                    style={{
                      fontSize: 11,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      fontWeight: 500,
                      color: 'hsl(var(--ds-fg-2))',
                    }}
                  >
                    {column.label}
                  </h3>
                  <span
                    style={{
                      fontSize: 11,
                      color: 'hsl(var(--ds-fg-4))',
                      fontVariantNumeric: 'tabular-nums',
                      background: 'hsl(var(--ds-line-2))',
                      padding: '0 6px',
                    }}
                  >
                    {columnTasks.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickAddColumn(column.status)}
                  style={{
                    width: 22,
                    height: 22,
                    display: 'grid',
                    placeItems: 'center',
                    color: 'hsl(var(--ds-fg-3))',
                    background: 'transparent',
                    border: 0,
                    cursor: 'pointer',
                  }}
                  aria-label="Adicionar tarefa"
                >
                  <Plus size={14} strokeWidth={1.5} />
                </button>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
                {columnTasks.map((task) => {
                  const dueInfo = getDueInfo(task.due_date);
                  const isOverdueAndOpen = dueInfo?.isOverdue && task.status !== 'concluida';
                  return (
                    <DraggableCard key={task.id} task={task}>
                      <div
                        onClick={() => navigate(`/tarefas/${task.id}`)}
                        style={{
                          padding: 10,
                          background: 'hsl(var(--ds-surface))',
                          border: '1px solid hsl(var(--ds-line-1))',
                          borderLeft: isOverdueAndOpen ? '3px solid hsl(var(--ds-danger))' : '1px solid hsl(var(--ds-line-1))',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          transition: 'background 0.15s, border-color 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'hsl(var(--ds-surface))';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              marginTop: 5,
                              flexShrink: 0,
                              background: priorityColor[task.priority] ?? priorityColor.standby,
                            }}
                          />
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: 'hsl(var(--ds-fg-1))',
                              lineHeight: 1.3,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {task.title}
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {task.assignees && task.assignees.length > 0 && (
                              <div style={{ display: 'inline-flex' }}>
                                {task.assignees.slice(0, 3).map((a, i) => (
                                  <Avatar
                                    key={a.user_id}
                                    style={{
                                      width: 18,
                                      height: 18,
                                      border: '2px solid hsl(var(--ds-surface))',
                                      marginLeft: i === 0 ? 0 : -5,
                                    }}
                                  >
                                    <AvatarImage src={a.avatar_url || ''} />
                                    <AvatarFallback style={{ fontSize: 8 }}>
                                      {a.display_name?.[0]?.toUpperCase() || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                                {task.assignees.length > 3 && (
                                  <span
                                    style={{
                                      width: 18,
                                      height: 18,
                                      borderRadius: '50%',
                                      background: 'hsl(var(--ds-line-2))',
                                      display: 'grid',
                                      placeItems: 'center',
                                      fontSize: 9,
                                      fontVariantNumeric: 'tabular-nums',
                                      marginLeft: -5,
                                      border: '2px solid hsl(var(--ds-surface))',
                                      color: 'hsl(var(--ds-fg-3))',
                                    }}
                                  >
                                    +{task.assignees.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                            {task.department && (
                              <span className="pill muted" style={{ fontSize: 9 }}>
                                {task.department}
                              </span>
                            )}
                          </div>
                          {dueInfo && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                color: dueInfo.isOverdue ? 'hsl(var(--ds-danger))' : 'hsl(var(--ds-fg-3))',
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {dueInfo.isOverdue && <AlertTriangle size={11} strokeWidth={1.5} />}
                              {dueInfo.text}
                            </span>
                          )}
                        </div>
                      </div>
                    </DraggableCard>
                  );
                })}

                {quickAddColumn === column.status && (
                  <div
                    style={{
                      padding: 10,
                      background: 'hsl(var(--ds-surface))',
                      border: '1px solid hsl(var(--ds-line-1))',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <Input
                      autoFocus
                      placeholder="Título da tarefa…"
                      value={quickAddTitle}
                      onChange={(e) => setQuickAddTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickAdd(column.status);
                        if (e.key === 'Escape') {
                          setQuickAddColumn(null);
                          setQuickAddTitle('');
                        }
                      }}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className="btn primary"
                        style={{ height: 26, padding: '0 10px', fontSize: 11 }}
                        onClick={() => handleQuickAdd(column.status)}
                        disabled={!quickAddTitle.trim()}
                      >
                        Criar
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{ height: 26, padding: '0 10px', fontSize: 11 }}
                        onClick={() => {
                          setQuickAddColumn(null);
                          setQuickAddTitle('');
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {columnTasks.length === 0 && quickAddColumn !== column.status && (
                  <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 11, color: 'hsl(var(--ds-fg-4))' }}>
                    Nenhuma tarefa
                  </div>
                )}
              </div>
            </DroppableColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask && (
          <div
            style={{
              padding: 10,
              background: 'hsl(var(--ds-surface))',
              border: '1px solid hsl(var(--ds-accent))',
              transform: 'rotate(2deg)',
              width: 240,
              opacity: 0.95,
              boxShadow: '0 8px 24px hsl(0 0% 0% / 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  marginTop: 5,
                  flexShrink: 0,
                  background: priorityColor[activeTask.priority] ?? priorityColor.standby,
                }}
              />
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'hsl(var(--ds-fg-1))',
                  lineHeight: 1.3,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {activeTask.title}
              </p>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
