import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, User, CheckCircle, Archive, Plus, ChevronDown } from 'lucide-react';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PriorityBadge } from '@/features/tasks/components/PriorityBadge';
import { StatusBadge } from '@/features/tasks/components/StatusBadge';
import { TaskSortableHeader } from '@/features/tasks/components/TaskSortableHeader';
import { InlineEditCell } from '@/features/tasks/components/InlineEditCell';
import { InlineSelectCell } from '@/features/tasks/components/InlineSelectCell';
import { InlineDateCell } from '@/features/tasks/components/InlineDateCell';
import { InlineDepartmentCell } from '@/features/tasks/components/InlineDepartmentCell';
import { InlineAssigneeCell } from '@/features/tasks/components/InlineAssigneeCell';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { useTaskMutations } from '@/features/tasks/hooks/useTaskMutations';
import { useDepartments } from '@/features/tasks/hooks/useDepartments';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { 
  TaskSortableField, 
  TaskSortOrder, 
  PRIORITY_ORDER, 
  STATUS_ORDER,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  TaskPriority,
  TaskStatus,
  Task
} from '@/features/tasks/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const defaultTaskState = {
  title: '',
  priority: 'standby' as TaskPriority,
  status: 'pendente' as TaskStatus,
  assigned_to: null as string | null,
  due_date: null as string | null,
  department: null as string | null,
};

export default function AllTasks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch all non-private tasks
  const { tasks: allTasks, isLoading } = useTasks({ is_private: false });
  const { updateTask, createTask } = useTaskMutations();
  const { departments } = useDepartments();
  const { users } = useUsers();

  // Filter tasks by category
  const activeTasks = useMemo(() => 
    allTasks.filter(t => t.status !== 'concluida' && t.status !== 'arquivada'),
    [allTasks]
  );

  const myTasks = useMemo(() => 
    activeTasks.filter(t => t.assigned_to === user?.id),
    [activeTasks, user?.id]
  );

  const completedTasks = useMemo(() => 
    allTasks.filter(t => t.status === 'concluida'),
    [allTasks]
  );

  const archivedTasks = useMemo(() => 
    allTasks.filter(t => t.status === 'arquivada'),
    [allTasks]
  );
  
  // Sorting states for each tab
  const [activeSortBy, setActiveSortBy] = useState<TaskSortableField>('due_date');
  const [activeSortOrder, setActiveSortOrder] = useState<TaskSortOrder>('asc');
  const [mySortBy, setMySortBy] = useState<TaskSortableField>('due_date');
  const [mySortOrder, setMySortOrder] = useState<TaskSortOrder>('asc');
  const [completedSortBy, setCompletedSortBy] = useState<TaskSortableField>('due_date');
  const [completedSortOrder, setCompletedSortOrder] = useState<TaskSortOrder>('desc');
  const [archivedSortBy, setArchivedSortBy] = useState<TaskSortableField>('due_date');
  const [archivedSortOrder, setArchivedSortOrder] = useState<TaskSortOrder>('desc');

  // New task state for inline creation
  const [newTask, setNewTask] = useState(defaultTaskState);

  // Parse date in local timezone
  const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Sort tasks helper
  const sortTasks = (tasks: Task[], sortBy: TaskSortableField, sortOrder: TaskSortOrder) => {
    if (!tasks.length) return tasks;

    return [...tasks].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '', 'pt-BR');
          break;
        case 'priority':
          const priorityA = PRIORITY_ORDER[a.priority as TaskPriority] ?? -1;
          const priorityB = PRIORITY_ORDER[b.priority as TaskPriority] ?? -1;
          comparison = priorityA - priorityB;
          break;
        case 'status':
          const statusA = STATUS_ORDER[a.status as TaskStatus] ?? -1;
          const statusB = STATUS_ORDER[b.status as TaskStatus] ?? -1;
          comparison = statusA - statusB;
          break;
        case 'assignee_name':
          if (!a.assignee_name && !b.assignee_name) comparison = 0;
          else if (!a.assignee_name) comparison = 1;
          else if (!b.assignee_name) comparison = -1;
          else comparison = a.assignee_name.localeCompare(b.assignee_name, 'pt-BR');
          break;
        case 'due_date':
          if (!a.due_date && !b.due_date) comparison = 0;
          else if (!a.due_date) comparison = 1;
          else if (!b.due_date) comparison = -1;
          else {
            const dateA = parseLocalDate(a.due_date);
            const dateB = parseLocalDate(b.due_date);
            comparison = dateA.getTime() - dateB.getTime();
          }
          break;
        case 'department':
          if (!a.department && !b.department) comparison = 0;
          else if (!a.department) comparison = 1;
          else if (!b.department) comparison = -1;
          else comparison = a.department.localeCompare(b.department, 'pt-BR');
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  // Sorted tasks for each tab
  const sortedActiveTasks = useMemo(() => 
    sortTasks(activeTasks, activeSortBy, activeSortOrder),
    [activeTasks, activeSortBy, activeSortOrder]
  );

  const sortedMyTasks = useMemo(() => 
    sortTasks(myTasks, mySortBy, mySortOrder),
    [myTasks, mySortBy, mySortOrder]
  );

  const sortedCompletedTasks = useMemo(() => 
    sortTasks(completedTasks, completedSortBy, completedSortOrder),
    [completedTasks, completedSortBy, completedSortOrder]
  );

  const sortedArchivedTasks = useMemo(() => 
    sortTasks(archivedTasks, archivedSortBy, archivedSortOrder),
    [archivedTasks, archivedSortBy, archivedSortOrder]
  );

  const getDueDateLabel = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = parseLocalDate(dueDate);
    
    const diffDays = differenceInDays(due, today);
    
    if (diffDays < 0) {
      return { 
        text: `(Atrasada há ${Math.abs(diffDays)} dia${Math.abs(diffDays) > 1 ? 's' : ''})`, 
        className: 'text-destructive' 
      };
    } else if (diffDays === 0) {
      return { text: '(Vence hoje)', className: 'text-yellow-600' };
    } else if (diffDays === 1) {
      return { text: '(Entrega amanhã)', className: 'text-yellow-600' };
    } else {
      return { text: `(Entrega em ${diffDays} dias)`, className: 'text-muted-foreground' };
    }
  };

  const isTaskActive = () => {
    return (
      newTask.title !== defaultTaskState.title ||
      newTask.priority !== defaultTaskState.priority ||
      newTask.status !== defaultTaskState.status ||
      newTask.assigned_to !== defaultTaskState.assigned_to ||
      newTask.due_date !== defaultTaskState.due_date ||
      newTask.department !== defaultTaskState.department
    );
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !user) return;

    try {
      await createTask.mutateAsync({
        title: newTask.title,
        priority: newTask.priority,
        status: newTask.status,
        assigned_to: newTask.assigned_to,
        due_date: newTask.due_date,
        department: newTask.department,
        is_private: false,
      });
      setNewTask(defaultTaskState);
      toast.success('Tarefa criada com sucesso');
    } catch (error) {
      toast.error('Erro ao criar tarefa');
    }
  };

  const renderTasksTable = (
    tasks: Task[],
    sortBy: TaskSortableField,
    sortOrder: TaskSortOrder,
    onSort: (field: TaskSortableField, order: TaskSortOrder) => void,
    showCreationRow = false
  ) => (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[25%] text-left">
            <TaskSortableHeader 
              field="title" 
              label="Título" 
              currentSortBy={sortBy}
              currentSortOrder={sortOrder}
              onSort={onSort}
            />
          </TableHead>
          <TableHead className="w-[10%] text-left">
            <TaskSortableHeader 
              field="priority" 
              label="Prioridade" 
              currentSortBy={sortBy}
              currentSortOrder={sortOrder}
              onSort={onSort}
            />
          </TableHead>
          <TableHead className="w-[12%] text-left">
            <TaskSortableHeader 
              field="status" 
              label="Status" 
              currentSortBy={sortBy}
              currentSortOrder={sortOrder}
              onSort={onSort}
            />
          </TableHead>
          <TableHead className="w-[20%] text-left">
            <TaskSortableHeader 
              field="assignee_name" 
              label="Responsável" 
              currentSortBy={sortBy}
              currentSortOrder={sortOrder}
              onSort={onSort}
            />
          </TableHead>
          <TableHead className="w-[18%] text-left">
            <TaskSortableHeader 
              field="due_date" 
              label="Prazo" 
              currentSortBy={sortBy}
              currentSortOrder={sortOrder}
              onSort={onSort}
            />
          </TableHead>
          <TableHead className="w-[15%] text-left">
            <TaskSortableHeader 
              field="department" 
              label="Departamento" 
              currentSortBy={sortBy}
              currentSortOrder={sortOrder}
              onSort={onSort}
            />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {/* Creation row */}
        {showCreationRow && (
          <TableRow className={`border-dashed ${!isTaskActive() ? 'opacity-70 hover:opacity-100' : ''}`}>
            <TableCell className="text-left">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="+ Adicionar nova tarefa..."
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                  className="border-0 p-0 h-auto text-sm bg-transparent focus-visible:ring-0 placeholder:italic"
                />
              </div>
            </TableCell>
            <TableCell className="text-left">
              <InlineSelectCell
                value={newTask.priority}
                options={Object.entries(PRIORITY_CONFIG).map(([value, config]) => ({
                  value,
                  label: config.label,
                }))}
                onSave={(value) => setNewTask(prev => ({ ...prev, priority: value as TaskPriority }))}
                renderValue={(val) => 
                  isTaskActive() ? (
                    <PriorityBadge priority={val as TaskPriority} />
                  ) : (
                    <span className="text-muted-foreground text-sm flex items-center gap-1">
                      Selecionar <ChevronDown className="w-3 h-3" />
                    </span>
                  )
                }
                renderOption={(optVal) => <PriorityBadge priority={optVal as TaskPriority} />}
              />
            </TableCell>
            <TableCell className="text-left">
              <InlineSelectCell
                value={newTask.status}
                options={Object.entries(STATUS_CONFIG).map(([value, config]) => ({
                  value,
                  label: config.label,
                }))}
                onSave={(value) => setNewTask(prev => ({ ...prev, status: value as TaskStatus }))}
                renderValue={(val) => 
                  isTaskActive() ? (
                    <StatusBadge status={val as TaskStatus} />
                  ) : (
                    <span className="text-muted-foreground text-sm flex items-center gap-1">
                      Selecionar <ChevronDown className="w-3 h-3" />
                    </span>
                  )
                }
                renderOption={(optVal) => <StatusBadge status={optVal as TaskStatus} />}
              />
            </TableCell>
            <TableCell className="text-left">
              <InlineAssigneeCell
                value={newTask.assigned_to}
                users={users}
                onSave={(value) => setNewTask(prev => ({ ...prev, assigned_to: value }))}
                isActive={isTaskActive()}
              />
            </TableCell>
            <TableCell className="text-left">
              <InlineDateCell
                value={newTask.due_date}
                onSave={(value) => setNewTask(prev => ({ ...prev, due_date: value }))}
              />
            </TableCell>
            <TableCell className="text-left">
              <div className="flex items-center gap-2">
                <InlineDepartmentCell
                  value={newTask.department}
                  departments={departments}
                  onSave={(value) => setNewTask(prev => ({ ...prev, department: value }))}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCreateTask}
                  disabled={!newTask.title.trim()}
                  className="h-6 w-6 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}

        {/* Task rows */}
        {tasks.map((task) => (
          <TableRow key={task.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/tarefas/${task.id}`)}>
            <TableCell className="text-left">
              <InlineEditCell
                value={task.title}
                onSave={(value) => updateTask.mutate({ 
                  id: task.id, 
                  updates: { title: value },
                  oldTask: task 
                })
                }
              />
            </TableCell>
            <TableCell className="text-left">
              <InlineSelectCell
                value={task.priority}
                options={Object.entries(PRIORITY_CONFIG).map(([val, config]) => ({
                  value: val,
                  label: config.label,
                }))}
                onSave={(val) => updateTask.mutate({ 
                  id: task.id, 
                  updates: { priority: val as TaskPriority },
                  oldTask: task 
                })}
                renderValue={(val) => <PriorityBadge priority={val as TaskPriority} />}
                renderOption={(optVal) => <PriorityBadge priority={optVal as TaskPriority} />}
              />
            </TableCell>
            <TableCell className="text-left">
              <InlineSelectCell
                value={task.status}
                options={Object.entries(STATUS_CONFIG).map(([val, config]) => ({
                  value: val,
                  label: config.label,
                }))}
                onSave={(val) => updateTask.mutate({ 
                  id: task.id, 
                  updates: { status: val as TaskStatus },
                  oldTask: task 
                })}
                renderValue={(val) => <StatusBadge status={val as TaskStatus} />}
                renderOption={(optVal) => <StatusBadge status={optVal as TaskStatus} />}
              />
            </TableCell>
            <TableCell className="text-left">
              <InlineAssigneeCell
                value={task.assigned_to}
                users={users}
                onSave={(value) => updateTask.mutate({ 
                  id: task.id, 
                  updates: { assigned_to: value },
                  oldTask: task 
                })}
              />
            </TableCell>
            <TableCell className="text-left">
              <InlineDateCell
                value={task.due_date}
                onSave={(val) => updateTask.mutate({ 
                  id: task.id, 
                  updates: { due_date: val },
                  oldTask: task 
                })}
              />
            </TableCell>
            <TableCell className="text-left">
              <InlineDepartmentCell
                value={task.department}
                departments={departments}
                onSave={(value) => updateTask.mutate({ 
                  id: task.id, 
                  updates: { department: value },
                  oldTask: task 
                })}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

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
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Tarefas de Time</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <Tabs defaultValue="active">
              <TabsList className="mb-4">
                <TabsTrigger value="active" className="gap-2">
                  Ativas
                  <Badge variant="secondary" className="ml-1">{activeTasks.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="mine" className="gap-2">
                  <User className="w-3 h-3" />
                  Minhas Tarefas
                  <Badge variant="secondary" className="ml-1">{myTasks.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="completed" className="gap-2">
                  <CheckCircle className="w-3 h-3" />
                  Concluídas
                  <Badge variant="secondary" className="ml-1">{completedTasks.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="archived" className="gap-2">
                  <Archive className="w-3 h-3" />
                  Arquivadas
                  <Badge variant="secondary" className="ml-1">{archivedTasks.length}</Badge>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="active">
                {activeTasks.length === 0 && !isTaskActive() ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma tarefa ativa</p>
                ) : (
                  renderTasksTable(
                    sortedActiveTasks, 
                    activeSortBy, 
                    activeSortOrder,
                    (field, order) => { setActiveSortBy(field); setActiveSortOrder(order); },
                    true
                  )
                )}
              </TabsContent>
              
              <TabsContent value="mine">
                {myTasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma tarefa atribuída a você</p>
                ) : (
                  renderTasksTable(
                    sortedMyTasks, 
                    mySortBy, 
                    mySortOrder,
                    (field, order) => { setMySortBy(field); setMySortOrder(order); }
                  )
                )}
              </TabsContent>
              
              <TabsContent value="completed">
                {completedTasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma tarefa concluída</p>
                ) : (
                  renderTasksTable(
                    sortedCompletedTasks, 
                    completedSortBy, 
                    completedSortOrder,
                    (field, order) => { setCompletedSortBy(field); setCompletedSortOrder(order); }
                  )
                )}
              </TabsContent>
              
              <TabsContent value="archived">
                {archivedTasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma tarefa arquivada</p>
                ) : (
                  renderTasksTable(
                    sortedArchivedTasks, 
                    archivedSortBy, 
                    archivedSortOrder,
                    (field, order) => { setArchivedSortBy(field); setArchivedSortOrder(order); }
                  )
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </ResponsiveContainer>
  );
}
