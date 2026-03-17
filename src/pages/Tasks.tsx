import { useState, useMemo } from 'react';
import { Plus, User, CheckCircle, Archive, CheckSquare } from 'lucide-react';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TaskCalendarWidget } from '@/features/tasks/components/TaskCalendarWidget';
import { TaskSummaryBar } from '@/features/tasks/components/TaskSummaryBar';
import { TasksTable } from '@/features/tasks/components/TasksTable';
import { TaskDialog } from '@/features/tasks/components/TaskDialog';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { useFilteredTaskStats } from '@/features/tasks/hooks/useFilteredTaskStats';
import { useAuthContext } from '@/contexts/AuthContext';

export default function Tasks() {
  const { user } = useAuthContext();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch all tasks (RLS ensures user only sees their own)
  const { tasks, isLoading } = useTasks();

  // Calculate stats
  const stats = useFilteredTaskStats(tasks);

  // Filter tasks by category
  const activeTasks = useMemo(() => 
    tasks.filter(t => t.status !== 'concluida' && t.status !== 'arquivada'),
    [tasks]
  );

  const myTasks = useMemo(() => 
    activeTasks.filter(t => 
      t.assignees?.some(a => a.user_id === user?.id)
    ),
    [activeTasks, user?.id]
  );

  const completedTasks = useMemo(() => 
    tasks.filter(t => t.status === 'concluida'),
    [tasks]
  );

  const archivedTasks = useMemo(() => 
    tasks.filter(t => t.status === 'arquivada'),
    [tasks]
  );

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

      <div className="space-y-6">
        {/* Calendar Widget */}
        <TaskCalendarWidget tasks={tasks} />

        {/* Summary Bar */}
        <TaskSummaryBar stats={stats} isLoading={isLoading} />

        {/* Tasks Content */}
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
      </div>

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </ResponsiveContainer>
  );
}
