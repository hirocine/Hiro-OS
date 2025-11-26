import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowRight } from 'lucide-react';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TaskStatsCards } from '@/features/tasks/components/TaskStatsCards';
import { TaskDialog } from '@/features/tasks/components/TaskDialog';
import { PriorityBadge } from '@/features/tasks/components/PriorityBadge';
import { StatusBadge } from '@/features/tasks/components/StatusBadge';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Tasks() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { tasks: teamTasks, isLoading: teamLoading } = useTasks({ is_team_task: true });
  const { tasks: myTasks, isLoading: myLoading } = useTasks();

  // Show only first 8 team tasks with blur effect
  const displayedTeamTasks = teamTasks.slice(0, 8);
  const hasMoreTeamTasks = teamTasks.length > 8;

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
            <div>
              <CardTitle>Tarefas do Time</CardTitle>
              <CardDescription>Tarefas visíveis para toda a equipe</CardDescription>
            </div>
            {hasMoreTeamTasks && (
              <Button variant="ghost" asChild>
                <Link to="/tarefas/equipe">
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
              ) : displayedTeamTasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma tarefa do time ainda</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Prazo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedTeamTasks.map((task) => (
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
                              <span className="text-sm">{task.assignee_name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Não atribuída</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {task.due_date ? (
                            <span className="text-sm">
                              {format(new Date(task.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sem prazo</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
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
            <CardTitle>Minhas Tarefas</CardTitle>
            <CardDescription>Tarefas atribuídas a você ou criadas por você</CardDescription>
          </CardHeader>
          <CardContent>
            {myLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : myTasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Você não tem tarefas ainda</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Departamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myTasks.map((task) => (
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
                        {task.due_date ? (
                          <span className="text-sm">
                            {format(new Date(task.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
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
      </div>

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </ResponsiveContainer>
  );
}
