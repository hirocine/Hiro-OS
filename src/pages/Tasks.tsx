import { useState, useMemo } from 'react';
import { Users, Lock, Plus, User, CheckCircle, Archive } from 'lucide-react';
import { useLocation } from 'react-router-dom';
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
import { cn } from '@/lib/utils';

export default function Tasks() {
  const { user } = useAuthContext();
  const location = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Derive section from URL
  const isPrivate = location.pathname.includes('/tarefas/privadas');
  const activeSection = isPrivate ? 'private' : 'general';

  // Fetch tasks based on active section
  const { tasks: generalTasks, isLoading: loadingGeneral } = useTasks({ is_private: false });
  const { tasks: privateTasks, isLoading: loadingPrivate } = useTasks({ is_private: true });

  const tasks = activeSection === 'general' ? generalTasks : privateTasks;
  const isLoading = activeSection === 'general' ? loadingGeneral : loadingPrivate;

  // Calculate stats for active section
  const stats = useFilteredTaskStats(tasks);

  // Filter tasks by category
  const activeTasks = useMemo(() => 
    tasks.filter(t => t.status !== 'concluida' && t.status !== 'arquivada'),
    [tasks]
  );

  const myTasks = useMemo(() => 
    activeTasks.filter(t => t.assigned_to === user?.id),
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
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader
        title={isPrivate ? "Tarefas Privadas" : "Tarefas Gerais"}
        subtitle={isPrivate ? "Suas tarefas pessoais, visíveis apenas para você" : "Gerencie as tarefas do time e acompanhe o progresso"}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>

        {/* Calendar Widget */}
        <TaskCalendarWidget tasks={tasks} isPrivate={isPrivate} />

        {/* Summary Bar */}
        <TaskSummaryBar 
          stats={stats} 
          isLoading={isLoading}
          variant={activeSection}
        />

        {/* Tasks Content */}
        {activeSection === 'general' ? (
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <CardTitle>Tarefas do Time</CardTitle>
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
                  <TasksTable 
                    tasks={activeTasks} 
                    isLoading={isLoading}
                    showCreationRow={true}
                    showAssignee={true}
                    isPrivate={false}
                  />
                </TabsContent>

                <TabsContent value="mine">
                  <TasksTable 
                    tasks={myTasks} 
                    isLoading={isLoading}
                    showAssignee={true}
                    isPrivate={false}
                  />
                </TabsContent>

                <TabsContent value="completed">
                  <TasksTable 
                    tasks={completedTasks} 
                    isLoading={isLoading}
                    showAssignee={true}
                    isPrivate={false}
                  />
                </TabsContent>

                <TabsContent value="archived">
                  <TasksTable 
                    tasks={archivedTasks} 
                    isLoading={isLoading}
                    showAssignee={true}
                    isPrivate={false}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Lock className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex items-center gap-2">
                  <CardTitle>Tarefas Privadas</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    (Visíveis apenas para você)
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="active">
                <TabsList className="mb-4">
                  <TabsTrigger value="active">
                    Ativas 
                    <Badge variant="secondary" className="ml-2">{activeTasks.length}</Badge>
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
                  <TasksTable 
                    tasks={activeTasks} 
                    isLoading={isLoading}
                    showCreationRow={true}
                    showAssignee={false}
                    isPrivate={true}
                  />
                </TabsContent>

                <TabsContent value="completed">
                  <TasksTable 
                    tasks={completedTasks} 
                    isLoading={isLoading}
                    showAssignee={false}
                    isPrivate={true}
                  />
                </TabsContent>

                <TabsContent value="archived">
                  <TasksTable 
                    tasks={archivedTasks} 
                    isLoading={isLoading}
                    showAssignee={false}
                    isPrivate={true}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>

      <TaskDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        defaultValues={{ is_private: isPrivate }}
      />
    </ResponsiveContainer>
  );
}
