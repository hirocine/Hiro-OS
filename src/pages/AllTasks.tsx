import { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PriorityBadge } from '@/features/tasks/components/PriorityBadge';
import { StatusBadge } from '@/features/tasks/components/StatusBadge';
import { TaskSortableHeader } from '@/features/tasks/components/TaskSortableHeader';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { 
  TaskSortableField, 
  TaskSortOrder, 
  PRIORITY_ORDER, 
  STATUS_ORDER,
  TaskPriority,
  TaskStatus
} from '@/features/tasks/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AllTasks() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Read filters from query string
  const statusFilter = searchParams.get('status') as TaskStatus | null;
  const assignedToMe = searchParams.get('assigned_to') === 'me';
  const privateOnly = searchParams.get('private') === 'true';

  // Build filters for useTasks
  const taskFilters = useMemo(() => {
    const filters: { status?: TaskStatus; assigned_to_me?: boolean; is_private?: boolean } = {};
    
    if (statusFilter) {
      filters.status = statusFilter;
    }
    
    if (assignedToMe) {
      filters.assigned_to_me = true;
    }
    
    if (privateOnly) {
      filters.is_private = true;
    }
    
    return Object.keys(filters).length > 0 ? filters : undefined;
  }, [statusFilter, assignedToMe, privateOnly]);

  const { tasks: allTasks, isLoading } = useTasks(taskFilters);

  // Filter out completed/archived if no status filter (default behavior)
  const tasks = useMemo(() => {
    if (statusFilter) {
      return allTasks; // Already filtered by status
    }
    // Default: exclude completed and archived
    return allTasks.filter(t => t.status !== 'concluida' && t.status !== 'arquivada');
  }, [allTasks, statusFilter]);
  
  // Sorting state - default by due_date ascending
  const [sortBy, setSortBy] = useState<TaskSortableField>('due_date');
  const [sortOrder, setSortOrder] = useState<TaskSortOrder>('asc');

  const handleSort = (field: TaskSortableField, order: TaskSortOrder) => {
    setSortBy(field);
    setSortOrder(order);
  };

  // Parse date in local timezone
  const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Sorted tasks
  const sortedTasks = useMemo(() => {
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
          // Null values go to the end
          if (!a.assignee_name && !b.assignee_name) comparison = 0;
          else if (!a.assignee_name) comparison = 1;
          else if (!b.assignee_name) comparison = -1;
          else comparison = a.assignee_name.localeCompare(b.assignee_name, 'pt-BR');
          break;

        case 'due_date':
          // Null values go to the end
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
          // Null values go to the end
          if (!a.department && !b.department) comparison = 0;
          else if (!a.department) comparison = 1;
          else if (!b.department) comparison = -1;
          else comparison = a.department.localeCompare(b.department, 'pt-BR');
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

  // Dynamic title based on filters
  const getPageTitle = () => {
    if (privateOnly) return 'Tarefas Privadas';
    if (assignedToMe) return 'Minhas Tarefas';
    if (statusFilter === 'concluida') return 'Tarefas Concluídas';
    if (statusFilter === 'arquivada') return 'Tarefas Arquivadas';
    return 'Todas as Tarefas';
  };

  const getPageDescription = () => {
    if (privateOnly) return `Suas tarefas privadas (${tasks.length})`;
    if (assignedToMe) return `Tarefas atribuídas a você (${tasks.length})`;
    if (statusFilter === 'concluida') return `Tarefas concluídas (${tasks.length})`;
    if (statusFilter === 'arquivada') return `Tarefas arquivadas (${tasks.length})`;
    return `Todas as tarefas da plataforma (${tasks.length})`;
  };

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
          <CardTitle>{getPageTitle()}</CardTitle>
          <CardDescription>{getPageDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma tarefa encontrada</p>
          ) : (
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[25%] text-left">
                    <TaskSortableHeader 
                      field="title" 
                      label="Título" 
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[12%] text-left">
                    <TaskSortableHeader 
                      field="priority" 
                      label="Prioridade" 
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[12%] text-left">
                    <TaskSortableHeader 
                      field="status" 
                      label="Status" 
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[18%] text-left">
                    <TaskSortableHeader 
                      field="assignee_name" 
                      label="Responsável" 
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[18%] text-left">
                    <TaskSortableHeader 
                      field="due_date" 
                      label="Prazo" 
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[15%] text-left">
                    <TaskSortableHeader 
                      field="department" 
                      label="Departamento" 
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTasks.map((task) => (
                  <TableRow 
                    key={task.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/tarefas/${task.id}`)}
                  >
                    <TableCell className="font-medium">
                      {task.title}
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={task.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={task.status} />
                    </TableCell>
                    <TableCell>
                      {task.assignee_name ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={task.assignee_avatar || undefined} />
                            <AvatarFallback>{task.assignee_name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{task.assignee_name.split(' ')[0]}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Não atribuída</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.due_date ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm">
                            {format(parseLocalDate(task.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                          <span className={`text-xs ${getDueDateLabel(task.due_date).className}`}>
                            {getDueDateLabel(task.due_date).text}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sem prazo</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.department || <span className="text-muted-foreground text-sm">-</span>}
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