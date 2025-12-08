import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PriorityBadge } from '@/features/tasks/components/PriorityBadge';
import { StatusBadge } from '@/features/tasks/components/StatusBadge';
import { InlineEditCell } from '@/features/tasks/components/InlineEditCell';
import { InlineSelectCell } from '@/features/tasks/components/InlineSelectCell';
import { InlineDateCell } from '@/features/tasks/components/InlineDateCell';
import { InlineAssigneeCell } from '@/features/tasks/components/InlineAssigneeCell';
import { InlineDepartmentCell } from '@/features/tasks/components/InlineDepartmentCell';
import { TaskSortableHeader } from '@/features/tasks/components/TaskSortableHeader';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { useTaskMutations } from '@/features/tasks/hooks/useTaskMutations';
import { useDepartments } from '@/features/tasks/hooks/useDepartments';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TaskPriority, TaskStatus, TaskSortableField, TaskSortOrder } from '@/features/tasks/types';
import { PRIORITY_ORDER, STATUS_ORDER } from '@/features/tasks/types';

export default function MyTasks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { users } = useUsers();
  const { departments } = useDepartments();
  const { tasks: allTasks, isLoading } = useTasks({ assigned_to_me: true, is_private: false });
  const { createTask, updateTask } = useTaskMutations();

  // Filter out completed/archived
  const tasks = useMemo(() => 
    allTasks.filter(t => t.status !== 'concluida' && t.status !== 'arquivada'),
    [allTasks]
  );

  // Sorting state
  const [sortBy, setSortBy] = useState<TaskSortableField>('due_date');
  const [sortOrder, setSortOrder] = useState<TaskSortOrder>('asc');

  // Inline creation state
  const defaultTaskState = {
    title: '',
    priority: 'standby' as TaskPriority,
    status: 'pendente' as TaskStatus,
    assigned_to: user?.id || null,
    due_date: null as string | null,
    department: '',
  };
  const [newTask, setNewTask] = useState(defaultTaskState);

  const isTaskActive = (task: typeof defaultTaskState) => {
    return task.title.trim() !== '' || task.priority !== 'standby' || 
           task.status !== 'pendente' || task.due_date !== null || task.department !== '';
  };

  const handleSort = (field: TaskSortableField, order: TaskSortOrder) => {
    setSortBy(field);
    setSortOrder(order);
  };

  const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const sortedTasks = useMemo(() => {
    if (!tasks.length) return tasks;
    return [...tasks].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'priority':
          comparison = (PRIORITY_ORDER[a.priority as TaskPriority] ?? 0) - (PRIORITY_ORDER[b.priority as TaskPriority] ?? 0);
          break;
        case 'status':
          comparison = (STATUS_ORDER[a.status as TaskStatus] ?? 0) - (STATUS_ORDER[b.status as TaskStatus] ?? 0);
          break;
        case 'due_date':
          if (!a.due_date && !b.due_date) comparison = 0;
          else if (!a.due_date) comparison = 1;
          else if (!b.due_date) comparison = -1;
          else comparison = parseLocalDate(a.due_date).getTime() - parseLocalDate(b.due_date).getTime();
          break;
        case 'department':
          if (!a.department && !b.department) comparison = 0;
          else if (!a.department) comparison = 1;
          else if (!b.department) comparison = -1;
          else comparison = a.department.localeCompare(b.department);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [tasks, sortBy, sortOrder]);

  const getDueDateLabel = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = parseLocalDate(dueDate);
    const diffDays = differenceInDays(due, today);
    
    if (diffDays < 0) return { text: `(Atrasada há ${Math.abs(diffDays)} dia${Math.abs(diffDays) > 1 ? 's' : ''})`, className: 'text-destructive' };
    if (diffDays === 0) return { text: '(Vence hoje)', className: 'text-yellow-600' };
    if (diffDays === 1) return { text: '(Entrega amanhã)', className: 'text-yellow-600' };
    return { text: `(Entrega em ${diffDays} dias)`, className: 'text-muted-foreground' };
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    await createTask.mutateAsync({
      title: newTask.title.trim(),
      priority: newTask.priority,
      status: newTask.status,
      assigned_to: newTask.assigned_to,
      due_date: newTask.due_date,
      department: newTask.department || null,
    });
    setNewTask(defaultTaskState);
  };

  const priorityOptions = [
    { value: 'standby', label: 'Stand-by' },
    { value: 'baixa', label: 'Baixa' },
    { value: 'media', label: 'Média' },
    { value: 'alta', label: 'Alta' },
    { value: 'urgente', label: 'Urgente' },
  ];

  const statusOptions = [
    { value: 'pendente', label: 'Pendente' },
    { value: 'em_progresso', label: 'Em Progresso' },
    { value: 'concluida', label: 'Concluída' },
    { value: 'arquivada', label: 'Arquivado' },
  ];

  return (
    <ResponsiveContainer maxWidth="7xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/tarefas">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Minhas Tarefas</CardTitle>
          <CardDescription>Tarefas atribuídas a você ({tasks.length})</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[25%] text-left">
                    <TaskSortableHeader field="title" label="Título" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                  </TableHead>
                  <TableHead className="w-[12%] text-left">
                    <TaskSortableHeader field="priority" label="Prioridade" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                  </TableHead>
                  <TableHead className="w-[12%] text-left">
                    <TaskSortableHeader field="status" label="Status" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                  </TableHead>
                  <TableHead className="w-[18%] text-left">Responsável</TableHead>
                  <TableHead className="w-[18%] text-left">
                    <TaskSortableHeader field="due_date" label="Prazo" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                  </TableHead>
                  <TableHead className="w-[15%] text-left">
                    <TaskSortableHeader field="department" label="Departamento" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Inline creation row */}
                <TableRow className="border-dashed opacity-70 hover:opacity-100">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Nova tarefa..."
                        value={newTask.title}
                        onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && handleCreateTask()}
                        className="h-8 border-0 bg-transparent p-0 focus-visible:ring-0"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    {isTaskActive(newTask) ? (
                      <InlineSelectCell
                        value={newTask.priority}
                        options={priorityOptions}
                        onSave={v => setNewTask({ ...newTask, priority: v as TaskPriority })}
                        renderValue={v => <PriorityBadge priority={v as TaskPriority} />}
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm">Selecionar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isTaskActive(newTask) ? (
                      <InlineSelectCell
                        value={newTask.status}
                        options={statusOptions}
                        onSave={v => setNewTask({ ...newTask, status: v as TaskStatus })}
                        renderValue={v => <StatusBadge status={v as TaskStatus} />}
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm">Selecionar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">Você</span>
                  </TableCell>
                  <TableCell>
                    <InlineDateCell
                      value={newTask.due_date}
                      onSave={v => setNewTask({ ...newTask, due_date: v })}
                    />
                  </TableCell>
                  <TableCell>
                    <InlineDepartmentCell
                      value={newTask.department || null}
                      departments={departments}
                      onSave={v => setNewTask({ ...newTask, department: v || '' })}
                    />
                  </TableCell>
                </TableRow>

                {sortedTasks.map(task => (
                  <TableRow key={task.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <InlineEditCell
                        value={task.title}
                        onSave={newValue => updateTask.mutate({ 
                          id: task.id, 
                          updates: { title: newValue },
                          oldTask: { title: task.title }
                        })}
                      />
                    </TableCell>
                    <TableCell>
                      <InlineSelectCell
                        value={task.priority}
                        options={priorityOptions}
                        onSave={v => updateTask.mutate({ id: task.id, updates: { priority: v as TaskPriority }, oldTask: { priority: task.priority }})}
                        renderValue={v => <PriorityBadge priority={v as TaskPriority} />}
                      />
                    </TableCell>
                    <TableCell>
                      <InlineSelectCell
                        value={task.status}
                        options={statusOptions}
                        onSave={v => updateTask.mutate({ id: task.id, updates: { status: v as TaskStatus }, oldTask: { status: task.status }})}
                        renderValue={v => <StatusBadge status={v as TaskStatus} />}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={task.assignee_avatar || undefined} />
                          <AvatarFallback>{task.assignee_name?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.assignee_name?.split(' ')[0] || 'Você'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <InlineDateCell
                        value={task.due_date}
                        onSave={v => updateTask.mutate({ id: task.id, updates: { due_date: v }, oldTask: { due_date: task.due_date }})}
                      />
                    </TableCell>
                    <TableCell>
                      <InlineDepartmentCell
                        value={task.department || null}
                        departments={departments}
                        onSave={v => updateTask.mutate({ id: task.id, updates: { department: v }, oldTask: { department: task.department }})}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </ResponsiveContainer>
  );
}
