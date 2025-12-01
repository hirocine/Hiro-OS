import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Eye, CheckCircle, ListTodo, User, ChevronDown, Archive } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TaskStatsCards } from '@/features/tasks/components/TaskStatsCards';
import { TaskDialog } from '@/features/tasks/components/TaskDialog';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { differenceInDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { TaskPriority, TaskStatus, TaskSortableField, TaskSortOrder } from '@/features/tasks/types';
import { PRIORITY_ORDER, STATUS_ORDER } from '@/features/tasks/types';

export default function Tasks() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { users } = useUsers();
  const { departments } = useDepartments();
  
  // Default task state for comparison
  const defaultTaskState = {
    title: '',
    priority: 'standby' as TaskPriority,
    status: 'pendente' as TaskStatus,
    assigned_to: null as string | null,
    due_date: null as string | null,
    department: '',
  };

  // Helper function to check if any field has been modified
  const isTaskActive = (task: typeof defaultTaskState) => {
    return (
      task.title.trim() !== '' ||
      task.priority !== 'standby' ||
      task.status !== 'pendente' ||
      task.assigned_to !== null ||
      task.due_date !== null ||
      task.department !== ''
    );
  };
  
  const [newTeamTask, setNewTeamTask] = useState(defaultTaskState);
  const [newMyTask, setNewMyTask] = useState(defaultTaskState);
  
  // Sorting state for team tasks
  const [teamSortBy, setTeamSortBy] = useState<TaskSortableField>('due_date');
  const [teamSortOrder, setTeamSortOrder] = useState<TaskSortOrder>('asc');
  
  // Sorting state for my tasks
  const [mySortBy, setMySortBy] = useState<TaskSortableField>('due_date');
  const [mySortOrder, setMySortOrder] = useState<TaskSortOrder>('asc');
  
  // Sorting state for completed tasks
  const [completedSortBy, setCompletedSortBy] = useState<TaskSortableField>('due_date');
  const [completedSortOrder, setCompletedSortOrder] = useState<TaskSortOrder>('desc');
  
  // Collapsible state for completed section (closed by default)
  const [completedOpen, setCompletedOpen] = useState(false);
  
  // Sorting state for archived tasks
  const [archivedSortBy, setArchivedSortBy] = useState<TaskSortableField>('due_date');
  const [archivedSortOrder, setArchivedSortOrder] = useState<TaskSortOrder>('desc');
  
  // Collapsible state for archived section (closed by default)
  const [archivedOpen, setArchivedOpen] = useState(false);
  
  const { tasks: allTeamTasks, isLoading: teamLoading } = useTasks();
  const { tasks: allMyTasks, isLoading: myLoading } = useTasks({ assigned_to_me: true });
  const { createTask, updateTask } = useTaskMutations();
  const { tasks: completedTasks, isLoading: completedLoading } = useTasks({ status: 'concluida' });
  const { tasks: archivedTasks, isLoading: archivedLoading } = useTasks({ status: 'arquivada' });

  // Filter out completed and archived tasks from active sections
  const teamTasks = useMemo(() => 
    allTeamTasks.filter(t => t.status !== 'concluida' && t.status !== 'arquivada'),
    [allTeamTasks]
  );
  
  const myTasks = useMemo(() => 
    allMyTasks.filter(t => t.status !== 'concluida' && t.status !== 'arquivada'),
    [allMyTasks]
  );

  // Helper to parse date without timezone issues
  const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Generic sorting function
  const sortTasks = <T extends typeof allTeamTasks[0]>(
    tasks: T[],
    sortBy: TaskSortableField,
    sortOrder: TaskSortOrder
  ): T[] => {
    if (!tasks.length) return [];
    
    return [...tasks].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'priority':
          const aPriority = PRIORITY_ORDER[a.priority as TaskPriority] ?? 0;
          const bPriority = PRIORITY_ORDER[b.priority as TaskPriority] ?? 0;
          comparison = aPriority - bPriority;
          break;
        case 'status':
          const aStatus = STATUS_ORDER[a.status as TaskStatus] ?? 0;
          const bStatus = STATUS_ORDER[b.status as TaskStatus] ?? 0;
          comparison = aStatus - bStatus;
          break;
        case 'assignee_name':
          if (!a.assignee_name && !b.assignee_name) comparison = 0;
          else if (!a.assignee_name) comparison = 1;
          else if (!b.assignee_name) comparison = -1;
          else comparison = a.assignee_name.localeCompare(b.assignee_name);
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
  };

  // Sort team tasks
  const sortedTeamTasks = useMemo(() => 
    sortTasks(teamTasks, teamSortBy, teamSortOrder),
    [teamTasks, teamSortBy, teamSortOrder]
  );

  // Sort my tasks
  const sortedMyTasks = useMemo(() => 
    sortTasks(myTasks, mySortBy, mySortOrder),
    [myTasks, mySortBy, mySortOrder]
  );

  // Sort completed tasks
  const sortedCompletedTasks = useMemo(() => 
    sortTasks(completedTasks, completedSortBy, completedSortOrder),
    [completedTasks, completedSortBy, completedSortOrder]
  );

  // Show only first 5 completed tasks
  const displayedCompletedTasks = sortedCompletedTasks.slice(0, 5);
  const hasMoreCompletedTasks = sortedCompletedTasks.length > 5;

  // Sort archived tasks
  const sortedArchivedTasks = useMemo(() => 
    sortTasks(archivedTasks, archivedSortBy, archivedSortOrder),
    [archivedTasks, archivedSortBy, archivedSortOrder]
  );

  // Show only first 5 archived tasks
  const displayedArchivedTasks = sortedArchivedTasks.slice(0, 5);
  const hasMoreArchivedTasks = sortedArchivedTasks.length > 5;

  const getDueDateLabel = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
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

  const handleCreateInlineTask = async (taskData: typeof newTeamTask, resetFn: () => void) => {
    if (!taskData.title.trim()) return;
    
    await createTask.mutateAsync({
      title: taskData.title.trim(),
      priority: taskData.priority,
      status: taskData.status,
      assigned_to: taskData.assigned_to,
      due_date: taskData.due_date,
      department: taskData.department || null,
    });
    
    resetFn();
  };

  const resetTeamTask = () => {
    setNewTeamTask({
      title: '',
      priority: 'standby',
      status: 'pendente',
      assigned_to: null,
      due_date: null,
      department: '',
    });
  };

  const resetMyTask = () => {
    setNewMyTask({
      title: '',
      priority: 'standby',
      status: 'pendente',
      assigned_to: null,
      due_date: null,
      department: '',
    });
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

  // Show only first 8 team tasks with blur effect
  const displayedTeamTasks = sortedTeamTasks.slice(0, 8);
  const hasMoreTeamTasks = sortedTeamTasks.length > 8;
  
  const handleTeamSort = (field: TaskSortableField, order: TaskSortOrder) => {
    setTeamSortBy(field);
    setTeamSortOrder(order);
  };
  
  const handleMySort = (field: TaskSortableField, order: TaskSortOrder) => {
    setMySortBy(field);
    setMySortOrder(order);
  };

  const handleCompletedSort = (field: TaskSortableField, order: TaskSortOrder) => {
    setCompletedSortBy(field);
    setCompletedSortOrder(order);
  };

  const handleArchivedSort = (field: TaskSortableField, order: TaskSortOrder) => {
    setArchivedSortBy(field);
    setArchivedSortOrder(order);
  };

  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader
        title="Tarefas"
        subtitle="Gerencie suas tarefas e acompanhe o progresso do time"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Tarefa
          </Button>
        }
      />

      <div className="space-y-8">
        {/* Stats */}
        <TaskStatsCards />

        {/* Team Tasks Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ListTodo className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Todas as Tarefas</CardTitle>
            </div>
            {hasMoreTeamTasks && (
              <Button variant="ghost" asChild>
                <Link to="/tarefas/todas">
                  Ver Todas <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="relative">
            {teamLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[21%] text-left">
                      <TaskSortableHeader field="title" label="Título" currentSortBy={teamSortBy} currentSortOrder={teamSortOrder} onSort={handleTeamSort} />
                    </TableHead>
                    <TableHead className="w-[12%] text-left">
                      <TaskSortableHeader field="priority" label="Prioridade" currentSortBy={teamSortBy} currentSortOrder={teamSortOrder} onSort={handleTeamSort} />
                    </TableHead>
                    <TableHead className="w-[12%] text-left">
                      <TaskSortableHeader field="status" label="Status" currentSortBy={teamSortBy} currentSortOrder={teamSortOrder} onSort={handleTeamSort} />
                    </TableHead>
                    <TableHead className="w-[18%] text-left">
                      <TaskSortableHeader field="assignee_name" label="Responsável" currentSortBy={teamSortBy} currentSortOrder={teamSortOrder} onSort={handleTeamSort} />
                    </TableHead>
                    <TableHead className="w-[16%] text-left">
                      <TaskSortableHeader field="due_date" label="Prazo" currentSortBy={teamSortBy} currentSortOrder={teamSortOrder} onSort={handleTeamSort} />
                    </TableHead>
                    <TableHead className="w-[13%] text-left">
                      <TaskSortableHeader field="department" label="Departamento" currentSortBy={teamSortBy} currentSortOrder={teamSortOrder} onSort={handleTeamSort} />
                    </TableHead>
                    <TableHead className="w-[8%] text-left">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                  <TableBody>
                    {displayedTeamTasks.map((task) => (
                      <TableRow 
                        key={task.id} 
                        className="hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">
                          <InlineEditCell
                            value={task.title}
                            onSave={(newValue) => updateTask.mutate({ 
                              id: task.id, 
                              updates: { title: newValue },
                              oldTask: { title: task.title }
                            })}
                          />
                        </TableCell>
                        <TableCell>
                          <InlineSelectCell
                            value={task.priority}
                            options={[
                              { value: 'standby', label: 'Stand-by' },
                              { value: 'baixa', label: 'Baixa' },
                              { value: 'media', label: 'Média' },
                              { value: 'alta', label: 'Alta' },
                              { value: 'urgente', label: 'Urgente' },
                            ]}
                            onSave={(newValue) => updateTask.mutate({ 
                              id: task.id, 
                              updates: { priority: newValue as any },
                              oldTask: { priority: task.priority }
                            })}
                            renderValue={(value) => <PriorityBadge priority={value as any} />}
                            renderOption={(value) => <PriorityBadge priority={value as any} />}
                          />
                        </TableCell>
                        <TableCell>
                          <InlineSelectCell
                            value={task.status}
                            options={[
                              { value: 'pendente', label: 'Pendente' },
                              { value: 'em_progresso', label: 'Em Progresso' },
                              { value: 'concluida', label: 'Concluída' },
                              { value: 'arquivada', label: 'Arquivado' },
                            ]}
                            onSave={(newValue) => updateTask.mutate({ 
                              id: task.id, 
                              updates: { status: newValue as any },
                              oldTask: { status: task.status }
                            })}
                            renderValue={(value) => <StatusBadge status={value as any} />}
                            renderOption={(value) => <StatusBadge status={value as any} />}
                          />
                        </TableCell>
                        <TableCell>
                          <InlineAssigneeCell
                            value={task.assigned_to}
                            users={users || []}
                            onSave={(newValue) => updateTask.mutate({ 
                              id: task.id, 
                              updates: { assigned_to: newValue },
                              oldTask: { assigned_to: task.assigned_to }
                            })}
                          />
                        </TableCell>
                        <TableCell>
                          <InlineDateCell
                            value={task.due_date}
                            onSave={(newDate) => updateTask.mutate({ 
                              id: task.id, 
                              updates: { due_date: newDate },
                              oldTask: { due_date: task.due_date }
                            })}
                          />
                        </TableCell>
                    <TableCell>
                      <InlineDepartmentCell
                        value={task.department}
                        departments={departments}
                        onSave={(newDept) => updateTask.mutate({ 
                          id: task.id, 
                          updates: { department: newDept },
                          oldTask: { department: task.department }
                        })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/tarefas/${task.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                    
                    {/* Inline creation row */}
                    <TableRow className="border-dashed border-t-2 border-muted-foreground/30 opacity-70 hover:opacity-100 transition-all duration-200">
                      {/* Título */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <Input
                            placeholder="+ Adicionar nova tarefa..."
                            value={newTeamTask.title}
                            onChange={(e) => setNewTeamTask(prev => ({ ...prev, title: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newTeamTask.title.trim()) {
                                handleCreateInlineTask(newTeamTask, resetTeamTask);
                              }
                            }}
                            className="h-8 border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/40 placeholder:italic"
                          />
                        </div>
                      </TableCell>
                      
                      {/* Prioridade */}
                      <TableCell className={cn("transition-opacity", !isTaskActive(newTeamTask) && "opacity-40")}>
                        <InlineSelectCell
                          value={newTeamTask.priority}
                          options={priorityOptions}
                          onSave={(val) => setNewTeamTask(prev => ({ ...prev, priority: val as TaskPriority }))}
                          renderValue={(v) => 
                            isTaskActive(newTeamTask) 
                              ? <PriorityBadge priority={v as TaskPriority} />
                              : <span className="text-muted-foreground/60 text-sm italic">Selecionar</span>
                          }
                          renderOption={(v) => <PriorityBadge priority={v as TaskPriority} />}
                        />
                      </TableCell>
                      
                      {/* Status */}
                      <TableCell className={cn("transition-opacity", !isTaskActive(newTeamTask) && "opacity-40")}>
                        <InlineSelectCell
                          value={newTeamTask.status}
                          options={statusOptions}
                          onSave={(val) => setNewTeamTask(prev => ({ ...prev, status: val as TaskStatus }))}
                          renderValue={(v) => 
                            isTaskActive(newTeamTask) 
                              ? <StatusBadge status={v as TaskStatus} />
                              : <span className="text-muted-foreground/60 text-sm italic">Selecionar</span>
                          }
                          renderOption={(v) => <StatusBadge status={v as TaskStatus} />}
                        />
                      </TableCell>
                      
                  {/* Responsável */}
                  <TableCell className={cn("transition-opacity", !isTaskActive(newTeamTask) && "opacity-40")}>
                    <InlineAssigneeCell
                      value={newTeamTask.assigned_to}
                      users={users || []}
                      onSave={(newValue) => {
                        setNewTeamTask(prev => ({ ...prev, assigned_to: newValue }));
                      }}
                      isActive={isTaskActive(newTeamTask)}
                    />
                  </TableCell>
                      
                      {/* Prazo */}
                      <TableCell className={cn("transition-opacity", !isTaskActive(newTeamTask) && "opacity-40")}>
                        <InlineDateCell
                          value={newTeamTask.due_date}
                          onSave={(date) => setNewTeamTask(prev => ({ ...prev, due_date: date }))}
                        />
                      </TableCell>
                      
                  {/* Departamento */}
                  <TableCell className={cn("transition-opacity", !isTaskActive(newTeamTask) && "opacity-40")}>
                    <InlineDepartmentCell
                      value={newTeamTask.department}
                      departments={departments}
                      onSave={(newValue) => {
                        setNewTeamTask(prev => ({ ...prev, department: newValue || '' }));
                      }}
                      isActive={isTaskActive(newTeamTask)}
                    />
                  </TableCell>
                      
                      {/* Ações */}
                      <TableCell className="transition-opacity">
                        <Button
                          variant="ghost" 
                          size="sm"
                          disabled={!newTeamTask.title.trim()}
                          onClick={() => handleCreateInlineTask(newTeamTask, resetTeamTask)}
                          className={cn("h-8 w-8 p-0", !newTeamTask.title && "opacity-40")}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
              </TableBody>
                </Table>
              )}
              
              {/* Blur overlay if more than 8 */}
              {hasMoreTeamTasks && (
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* My Tasks Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <User className="w-5 h-5 text-orange-500" />
              </div>
              <CardTitle className="text-lg">Minhas Tarefas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {myLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : (
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[21%] text-left">
                      <TaskSortableHeader field="title" label="Título" currentSortBy={mySortBy} currentSortOrder={mySortOrder} onSort={handleMySort} />
                    </TableHead>
                    <TableHead className="w-[12%] text-left">
                      <TaskSortableHeader field="priority" label="Prioridade" currentSortBy={mySortBy} currentSortOrder={mySortOrder} onSort={handleMySort} />
                    </TableHead>
                    <TableHead className="w-[12%] text-left">
                      <TaskSortableHeader field="status" label="Status" currentSortBy={mySortBy} currentSortOrder={mySortOrder} onSort={handleMySort} />
                    </TableHead>
                    <TableHead className="w-[18%] text-left">
                      <TaskSortableHeader field="assignee_name" label="Responsável" currentSortBy={mySortBy} currentSortOrder={mySortOrder} onSort={handleMySort} />
                    </TableHead>
                    <TableHead className="w-[16%] text-left">
                      <TaskSortableHeader field="due_date" label="Prazo" currentSortBy={mySortBy} currentSortOrder={mySortOrder} onSort={handleMySort} />
                    </TableHead>
                    <TableHead className="w-[13%] text-left">
                      <TaskSortableHeader field="department" label="Departamento" currentSortBy={mySortBy} currentSortOrder={mySortOrder} onSort={handleMySort} />
                    </TableHead>
                    <TableHead className="w-[8%] text-left">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                  <TableBody>
                    {sortedMyTasks.map((task) => (
                    <TableRow 
                      key={task.id} 
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        <InlineEditCell
                          value={task.title}
                          onSave={(newValue) => updateTask.mutate({ 
                            id: task.id, 
                            updates: { title: newValue },
                            oldTask: { title: task.title }
                          })}
                        />
                      </TableCell>
                      <TableCell>
                        <InlineSelectCell
                          value={task.priority}
                          options={[
                            { value: 'standby', label: 'Stand-by' },
                            { value: 'baixa', label: 'Baixa' },
                            { value: 'media', label: 'Média' },
                            { value: 'alta', label: 'Alta' },
                            { value: 'urgente', label: 'Urgente' },
                          ]}
                          onSave={(newValue) => updateTask.mutate({ 
                            id: task.id, 
                            updates: { priority: newValue as any },
                            oldTask: { priority: task.priority }
                          })}
                          renderValue={(value) => <PriorityBadge priority={value as any} />}
                          renderOption={(value) => <PriorityBadge priority={value as any} />}
                        />
                      </TableCell>
                      <TableCell>
                        <InlineSelectCell
                          value={task.status}
                          options={[
                            { value: 'pendente', label: 'Pendente' },
                            { value: 'em_progresso', label: 'Em Progresso' },
                            { value: 'concluida', label: 'Concluída' },
                            { value: 'arquivada', label: 'Arquivado' },
                          ]}
                          onSave={(newValue) => updateTask.mutate({ 
                            id: task.id, 
                            updates: { status: newValue as any },
                            oldTask: { status: task.status }
                          })}
                          renderValue={(value) => <StatusBadge status={value as any} />}
                          renderOption={(value) => <StatusBadge status={value as any} />}
                        />
                      </TableCell>
                      <TableCell>
                        <InlineAssigneeCell
                          value={task.assigned_to}
                          users={users || []}
                          onSave={(newValue) => updateTask.mutate({ 
                            id: task.id, 
                            updates: { assigned_to: newValue },
                            oldTask: { assigned_to: task.assigned_to }
                          })}
                        />
                      </TableCell>
                      <TableCell>
                        <InlineDateCell
                          value={task.due_date}
                          onSave={(newDate) => updateTask.mutate({ 
                            id: task.id, 
                            updates: { due_date: newDate },
                            oldTask: { due_date: task.due_date }
                          })}
                        />
                      </TableCell>
                        <TableCell>
                          <InlineDepartmentCell
                            value={task.department}
                            departments={departments}
                            onSave={(newDept) => updateTask.mutate({ 
                              id: task.id, 
                              updates: { department: newDept },
                              oldTask: { department: task.department }
                            })}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/tarefas/${task.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Inline creation row */}
                  <TableRow className="border-dashed border-t-2 border-muted-foreground/30 opacity-70 hover:opacity-100 transition-all duration-200">
                    {/* Título */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <Input
                          placeholder="+ Adicionar nova tarefa..."
                          value={newMyTask.title}
                          onChange={(e) => setNewMyTask(prev => ({ ...prev, title: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newMyTask.title.trim()) {
                              handleCreateInlineTask(newMyTask, resetMyTask);
                            }
                          }}
                          className="h-8 border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/40 placeholder:italic"
                        />
                      </div>
                    </TableCell>
                    
                    {/* Prioridade */}
                    <TableCell className={cn("transition-opacity", !isTaskActive(newMyTask) && "opacity-40")}>
                      <InlineSelectCell
                        value={newMyTask.priority}
                        options={priorityOptions}
                        onSave={(val) => setNewMyTask(prev => ({ ...prev, priority: val as TaskPriority }))}
                        renderValue={(v) => 
                          isTaskActive(newMyTask) 
                            ? <PriorityBadge priority={v as TaskPriority} />
                            : <span className="text-muted-foreground/60 text-sm italic">Selecionar</span>
                        }
                        renderOption={(v) => <PriorityBadge priority={v as TaskPriority} />}
                      />
                    </TableCell>
                    
                    {/* Status */}
                    <TableCell className={cn("transition-opacity", !isTaskActive(newMyTask) && "opacity-40")}>
                      <InlineSelectCell
                        value={newMyTask.status}
                        options={statusOptions}
                        onSave={(val) => setNewMyTask(prev => ({ ...prev, status: val as TaskStatus }))}
                        renderValue={(v) => 
                          isTaskActive(newMyTask) 
                            ? <StatusBadge status={v as TaskStatus} />
                            : <span className="text-muted-foreground/60 text-sm italic">Selecionar</span>
                        }
                        renderOption={(v) => <StatusBadge status={v as TaskStatus} />}
                      />
                    </TableCell>
                    
                    {/* Responsável */}
                    <TableCell className={cn("transition-opacity", !isTaskActive(newMyTask) && "opacity-40")}>
                      <InlineAssigneeCell
                        value={newMyTask.assigned_to}
                        users={users || []}
                        onSave={(newValue) => {
                          setNewMyTask(prev => ({ ...prev, assigned_to: newValue }));
                        }}
                        isActive={isTaskActive(newMyTask)}
                      />
                    </TableCell>
                    
                    {/* Prazo */}
                    <TableCell className={cn("transition-opacity", !isTaskActive(newMyTask) && "opacity-40")}>
                      <InlineDateCell
                        value={newMyTask.due_date}
                        onSave={(date) => setNewMyTask(prev => ({ ...prev, due_date: date }))}
                      />
                    </TableCell>
                    
                    {/* Departamento */}
                    <TableCell className={cn("transition-opacity", !isTaskActive(newMyTask) && "opacity-40")}>
                      <InlineDepartmentCell
                        value={newMyTask.department}
                        departments={departments}
                        onSave={(newValue) => {
                          setNewMyTask(prev => ({ ...prev, department: newValue || '' }));
                        }}
                        isActive={isTaskActive(newMyTask)}
                      />
                    </TableCell>
                    
                    {/* Ações */}
                    <TableCell className="transition-opacity">
                      <Button
                        variant="ghost" 
                        size="sm"
                        disabled={!newMyTask.title.trim()}
                        onClick={() => handleCreateInlineTask(newMyTask, resetMyTask)}
                        className={cn("h-8 w-8 p-0", !newMyTask.title && "opacity-40")}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
              </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Completed Tasks Section - Collapsible */}
        <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
          <Card className="border-success/30 bg-success/5">
            <CollapsibleTrigger asChild>
              <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-success/10 transition-colors rounded-t-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <CardTitle className="text-lg">Tarefas Concluídas</CardTitle>
                  <Badge variant="secondary" className="bg-success/20 text-success border-success/30">
                    {completedTasks.length}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {completedOpen && hasMoreCompletedTasks && (
                    <Button variant="ghost" asChild onClick={(e) => e.stopPropagation()}>
                      <Link to="/tarefas/todas?status=concluida">
                        Ver Todas <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  )}
                  <ChevronDown className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform duration-200",
                    completedOpen && "rotate-180"
                  )} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent>
                {completedLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
                  </div>
                ) : displayedCompletedTasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma tarefa concluída ainda</p>
                ) : (
                  <Table className="table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[21%] text-left">
                          <TaskSortableHeader field="title" label="Título" currentSortBy={completedSortBy} currentSortOrder={completedSortOrder} onSort={handleCompletedSort} />
                        </TableHead>
                        <TableHead className="w-[12%] text-left">
                          <TaskSortableHeader field="priority" label="Prioridade" currentSortBy={completedSortBy} currentSortOrder={completedSortOrder} onSort={handleCompletedSort} />
                        </TableHead>
                        <TableHead className="w-[12%] text-left">
                          <TaskSortableHeader field="status" label="Status" currentSortBy={completedSortBy} currentSortOrder={completedSortOrder} onSort={handleCompletedSort} />
                        </TableHead>
                        <TableHead className="w-[18%] text-left">
                          <TaskSortableHeader field="assignee_name" label="Responsável" currentSortBy={completedSortBy} currentSortOrder={completedSortOrder} onSort={handleCompletedSort} />
                        </TableHead>
                        <TableHead className="w-[16%] text-left">
                          <TaskSortableHeader field="due_date" label="Prazo" currentSortBy={completedSortBy} currentSortOrder={completedSortOrder} onSort={handleCompletedSort} />
                        </TableHead>
                        <TableHead className="w-[13%] text-left">
                          <TaskSortableHeader field="department" label="Departamento" currentSortBy={completedSortBy} currentSortOrder={completedSortOrder} onSort={handleCompletedSort} />
                        </TableHead>
                        <TableHead className="w-[8%] text-left">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedCompletedTasks.map((task) => (
                        <TableRow 
                          key={task.id} 
                          className="hover:bg-success/10"
                        >
                          <TableCell className="font-medium text-muted-foreground">
                            {task.title}
                          </TableCell>
                          <TableCell>
                            <PriorityBadge priority={task.priority as TaskPriority} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={task.status as TaskStatus} />
                          </TableCell>
                          <TableCell>
                            {task.assignee_name ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={task.assignee_avatar || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {task.assignee_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-muted-foreground truncate">{task.assignee_name.split(' ')[0]}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/50 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {task.updated_at ? format(new Date(task.updated_at), 'dd/MM/yyyy') : '—'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {task.department || '—'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/tarefas/${task.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Archived Tasks Section - Collapsible */}
        <Collapsible open={archivedOpen} onOpenChange={setArchivedOpen}>
          <Card className="border-destructive/30 bg-destructive/5">
            <CollapsibleTrigger asChild>
              <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-destructive/10 transition-colors rounded-t-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <Archive className="w-5 h-5 text-destructive" />
                  </div>
                  <CardTitle className="text-lg">Tarefas Arquivadas</CardTitle>
                  <Badge variant="secondary" className="bg-destructive/20 text-destructive border-destructive/30">
                    {archivedTasks.length}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {archivedOpen && hasMoreArchivedTasks && (
                    <Button variant="ghost" asChild onClick={(e) => e.stopPropagation()}>
                      <Link to="/tarefas/todas?status=arquivada">
                        Ver Todas <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  )}
                  <ChevronDown className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform duration-200",
                    archivedOpen && "rotate-180"
                  )} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent>
                {archivedLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
                  </div>
                ) : displayedArchivedTasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma tarefa arquivada ainda</p>
                ) : (
                  <Table className="table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[21%] text-left">
                          <TaskSortableHeader field="title" label="Título" currentSortBy={archivedSortBy} currentSortOrder={archivedSortOrder} onSort={handleArchivedSort} />
                        </TableHead>
                        <TableHead className="w-[12%] text-left">
                          <TaskSortableHeader field="priority" label="Prioridade" currentSortBy={archivedSortBy} currentSortOrder={archivedSortOrder} onSort={handleArchivedSort} />
                        </TableHead>
                        <TableHead className="w-[12%] text-left">
                          <TaskSortableHeader field="status" label="Status" currentSortBy={archivedSortBy} currentSortOrder={archivedSortOrder} onSort={handleArchivedSort} />
                        </TableHead>
                        <TableHead className="w-[18%] text-left">
                          <TaskSortableHeader field="assignee_name" label="Responsável" currentSortBy={archivedSortBy} currentSortOrder={archivedSortOrder} onSort={handleArchivedSort} />
                        </TableHead>
                        <TableHead className="w-[16%] text-left">
                          <TaskSortableHeader field="due_date" label="Prazo" currentSortBy={archivedSortBy} currentSortOrder={archivedSortOrder} onSort={handleArchivedSort} />
                        </TableHead>
                        <TableHead className="w-[13%] text-left">
                          <TaskSortableHeader field="department" label="Departamento" currentSortBy={archivedSortBy} currentSortOrder={archivedSortOrder} onSort={handleArchivedSort} />
                        </TableHead>
                        <TableHead className="w-[8%] text-left">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedArchivedTasks.map((task) => (
                        <TableRow 
                          key={task.id} 
                          className="hover:bg-destructive/10"
                        >
                          <TableCell className="font-medium text-muted-foreground">
                            {task.title}
                          </TableCell>
                          <TableCell>
                            <PriorityBadge priority={task.priority as TaskPriority} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={task.status as TaskStatus} />
                          </TableCell>
                          <TableCell>
                            {task.assignee_name ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={task.assignee_avatar || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {task.assignee_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-muted-foreground truncate">{task.assignee_name.split(' ')[0]}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/50 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {task.updated_at ? format(new Date(task.updated_at), 'dd/MM/yyyy') : '—'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {task.department || '—'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/tarefas/${task.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* Task Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </ResponsiveContainer>
  );
}
