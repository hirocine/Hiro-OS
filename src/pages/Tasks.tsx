import { useState, useMemo } from 'react';
import { Users, Lock, Plus, User, CheckCircle, Archive } from 'lucide-react';
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

type MainSection = 'general' | 'private';
type TaskSubTab = 'active' | 'mine' | 'completed' | 'archived';

export default function Tasks() {
  const { user } = useAuthContext();
  const [activeSection, setActiveSection] = useState<MainSection>('general');
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const isPrivate = activeSection === 'private';

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

      <div className="space-y-6">
        {/* Main Section Tabs */}
        <Tabs 
          value={activeSection} 
          onValueChange={(v) => setActiveSection(v as MainSection)}
        >
          <TabsList className="h-12">
            <TabsTrigger 
              value="general" 
              className={cn(
                "h-10 px-6 gap-2 data-[state=active]:shadow-md transition-all",
                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              )}
            >
              <Users className="h-4 w-4" />
              <span className="font-medium">Tarefas Gerais</span>
            </TabsTrigger>
            <TabsTrigger 
              value="private" 
              className={cn(
                "h-10 px-6 gap-2 data-[state=active]:shadow-md transition-all",
                "data-[state=active]:bg-purple-500 data-[state=active]:text-white"
              )}
            >
              <Lock className="h-4 w-4" />
              <span className="font-medium">Tarefas Privadas</span>
            </TabsTrigger>
          </TabsList>

          {/* Calendar Widget - receives tasks as prop to avoid duplicate query */}
          <div className="mt-4">
            <TaskCalendarWidget tasks={tasks} isPrivate={isPrivate} />
          </div>

          {/* Summary Bar */}
          <div className="mt-6">
            <TaskSummaryBar 
              stats={stats} 
              isLoading={isLoading}
              variant={activeSection}
            />
          </div>

          {/* Tasks Content */}
          <TabsContent value="general" className="mt-6">
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
          </TabsContent>

          <TabsContent value="private" className="mt-6">
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
          </TabsContent>
        </Tabs>
      </div>

      <TaskDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        defaultValues={{ is_private: isPrivate }}
      />
    </ResponsiveContainer>
  );
}
