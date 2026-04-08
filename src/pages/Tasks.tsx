import { useState, useMemo } from 'react';
import { Plus, User, CheckCircle, Archive, CheckSquare, List, Columns3, CalendarDays, Search } from 'lucide-react';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { TaskSummaryBar } from '@/features/tasks/components/TaskSummaryBar';
import { TasksTable } from '@/features/tasks/components/TasksTable';
import { TaskDialog } from '@/features/tasks/components/TaskDialog';
import { TaskKanbanView } from '@/features/tasks/components/TaskKanbanView';
import { TaskCalendarView } from '@/features/tasks/components/TaskCalendarView';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { useFilteredTaskStats } from '@/features/tasks/hooks/useFilteredTaskStats';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { useDepartments } from '@/features/tasks/hooks/useDepartments';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/features/tasks/types';
import { cn } from '@/lib/utils';

type ViewType = 'lista' | 'kanban' | 'calendario';

export default function Tasks() {
  const { user } = useAuthContext();
  const [dialogOpen, setDialogOpen] = useState(false);

  // View state
  const [currentView, setCurrentView] = useState<ViewType>('lista');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');

  // Data hooks
  const { tasks, isLoading } = useTasks();
  const { users } = useUsers();
  const { departments } = useDepartments();

  // Apply all filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      if (filterDepartment !== 'all' && task.department !== filterDepartment) return false;
      if (filterAssignee !== 'all' && !task.assignees?.some(a => a.user_id === filterAssignee)) return false;
      return true;
    });
  }, [tasks, searchQuery, filterPriority, filterStatus, filterDepartment, filterAssignee]);

  // Calculate stats from filtered tasks
  const stats = useFilteredTaskStats(filteredTasks);

  // Filter tasks by category
  const activeTasks = useMemo(() =>
    filteredTasks.filter(t => t.status !== 'concluida' && t.status !== 'arquivada'),
    [filteredTasks]
  );

  const myTasks = useMemo(() =>
    activeTasks.filter(t =>
      t.assignees?.some(a => a.user_id === user?.id)
    ),
    [activeTasks, user?.id]
  );

  const completedTasks = useMemo(() =>
    filteredTasks.filter(t => t.status === 'concluida'),
    [filteredTasks]
  );

  const archivedTasks = useMemo(() =>
    filteredTasks.filter(t => t.status === 'arquivada'),
    [filteredTasks]
  );

  const viewButtons: { key: ViewType; label: string; icon: React.ReactNode }[] = [
    { key: 'lista', label: 'Lista', icon: <List className="h-3.5 w-3.5" /> },
    { key: 'kanban', label: 'Kanban', icon: <Columns3 className="h-3.5 w-3.5" /> },
    { key: 'calendario', label: 'Calendário', icon: <CalendarDays className="h-3.5 w-3.5" /> },
  ];

  return (
    <ResponsiveContainer maxWidth="7xl" className="animate-fade-in">
      <PageHeader
        title="Tarefas"
        subtitle="Gerencie suas tarefas e acompanhe o progresso"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Tarefa
          </Button>
        }
      />

      <div className="space-y-4">
        {/* Summary Bar */}
        <TaskSummaryBar stats={stats} isLoading={isLoading} />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
            {viewButtons.map(v => (
              <button
                key={v.key}
                onClick={() => setCurrentView(v.key)}
                className={cn(
                  'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-all font-medium',
                  currentView === v.key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {v.icon}
                {v.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tarefas..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Priority filter */}
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Department filter */}
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {departments.map(d => (
                <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Assignee filter */}
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.display_name || u.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {currentView === 'lista' && (
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CheckSquare className="w-5 h-5 text-primary" />
                </div>
                <CardTitle>Tarefas</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="active">
                <TabsList className="mb-4">
                  <TabsTrigger value="active">
                    Ativas
                    <Badge variant="secondary" className="ml-2">{activeTasks.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="mine">
                    <User className="w-3 h-3 mr-1" />
                    Minhas
                    <Badge variant="secondary" className="ml-2">{myTasks.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Concluídas
                    <Badge variant="secondary" className="ml-2">{completedTasks.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="archived">
                    <Archive className="w-3 h-3 mr-1" />
                    Arquivadas
                    <Badge variant="secondary" className="ml-2">{archivedTasks.length}</Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="active">
                  <TasksTable tasks={activeTasks} isLoading={isLoading} showCreationRow={true} showAssignee={true} />
                </TabsContent>

                <TabsContent value="mine">
                  <TasksTable tasks={myTasks} isLoading={isLoading} showAssignee={true} />
                </TabsContent>

                <TabsContent value="completed">
                  <TasksTable tasks={completedTasks} isLoading={isLoading} showAssignee={true} />
                </TabsContent>

                <TabsContent value="archived">
                  <TasksTable tasks={archivedTasks} isLoading={isLoading} showAssignee={true} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {currentView === 'kanban' && (
          <TaskKanbanView tasks={filteredTasks} isLoading={isLoading} />
        )}

        {currentView === 'calendario' && (
          <TaskCalendarView tasks={filteredTasks} isLoading={isLoading} />
        )}
      </div>

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </ResponsiveContainer>
  );
}
