import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Users, Eye } from 'lucide-react';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TaskStatsCards } from '@/features/tasks/components/TaskStatsCards';
import { TaskDialog } from '@/features/tasks/components/TaskDialog';
import { PriorityBadge } from '@/features/tasks/components/PriorityBadge';
import { StatusBadge } from '@/features/tasks/components/StatusBadge';
import { InlineEditCell } from '@/features/tasks/components/InlineEditCell';
import { InlineSelectCell } from '@/features/tasks/components/InlineSelectCell';
import { InlineDateCell } from '@/features/tasks/components/InlineDateCell';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { differenceInDays } from 'date-fns';

export default function Tasks() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTeamTaskTitle, setNewTeamTaskTitle] = useState('');
  const [newMyTaskTitle, setNewMyTaskTitle] = useState('');
  
  const { tasks: teamTasks, isLoading: teamLoading, updateTask: updateTeamTask, createTask } = useTasks({ is_team_task: true });
  const { tasks: myTasks, isLoading: myLoading, updateTask: updateMyTask } = useTasks({ is_team_task: false });

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

  const handleCreateInlineTask = async (title: string, isTeamTask: boolean, resetFn: () => void) => {
    if (!title.trim()) return;
    
    await createTask.mutateAsync({
      title: title.trim(),
      is_team_task: isTeamTask,
      priority: 'media',
      status: 'pendente',
    });
    
    resetFn();
  };

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
                    <TableHead className="w-[22%]">Título</TableHead>
                    <TableHead className="w-[10%]">Prioridade</TableHead>
                    <TableHead className="w-[12%]">Status</TableHead>
                    <TableHead className="w-[18%]">Responsável</TableHead>
                    <TableHead className="w-[16%]">Prazo</TableHead>
                    <TableHead className="w-[14%]">Departamento</TableHead>
                    <TableHead className="w-[8%]">Ações</TableHead>
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
                            onSave={(newValue) => updateTeamTask.mutate({ 
                              id: task.id, 
                              updates: { title: newValue } 
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
                            onSave={(newValue) => updateTeamTask.mutate({ 
                              id: task.id, 
                              updates: { priority: newValue as any } 
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
                            onSave={(newValue) => updateTeamTask.mutate({ 
                              id: task.id, 
                              updates: { status: newValue as any } 
                            })}
                            renderValue={(value) => <StatusBadge status={value as any} />}
                            renderOption={(value) => <StatusBadge status={value as any} />}
                          />
                        </TableCell>
                        <TableCell>
                          {task.is_team_task ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <span className="text-sm">Time Hiro</span>
                            </div>
                          ) : task.assignee_name ? (
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
                          <InlineDateCell
                            value={task.due_date}
                            onSave={(newDate) => updateTeamTask.mutate({ 
                              id: task.id, 
                              updates: { due_date: newDate } 
                            })}
                          />
                        </TableCell>
                    <TableCell>
                      {task.department || <span className="text-muted-foreground text-sm">-</span>}
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
                    <TableRow className="border-dashed hover:bg-transparent">
                      <TableCell colSpan={7}>
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Nova tarefa do time..."
                            value={newTeamTaskTitle}
                            onChange={(e) => setNewTeamTaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCreateInlineTask(newTeamTaskTitle, true, () => setNewTeamTaskTitle(''));
                              }
                            }}
                            onBlur={() => {
                              if (newTeamTaskTitle.trim()) {
                                handleCreateInlineTask(newTeamTaskTitle, true, () => setNewTeamTaskTitle(''));
                              }
                            }}
                            className="h-8 border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/60"
                          />
                        </div>
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
                    <TableHead className="w-[22%]">Título</TableHead>
                    <TableHead className="w-[10%]">Prioridade</TableHead>
                    <TableHead className="w-[12%]">Status</TableHead>
                    <TableHead className="w-[18%]">Responsável</TableHead>
                    <TableHead className="w-[16%]">Prazo</TableHead>
                    <TableHead className="w-[14%]">Departamento</TableHead>
                    <TableHead className="w-[8%]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myTasks.map((task) => (
                    <TableRow 
                      key={task.id} 
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        <InlineEditCell
                          value={task.title}
                          onSave={(newValue) => updateMyTask.mutate({ 
                            id: task.id, 
                            updates: { title: newValue } 
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
                          onSave={(newValue) => updateMyTask.mutate({ 
                            id: task.id, 
                            updates: { priority: newValue as any } 
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
                          onSave={(newValue) => updateMyTask.mutate({ 
                            id: task.id, 
                            updates: { status: newValue as any } 
                          })}
                          renderValue={(value) => <StatusBadge status={value as any} />}
                          renderOption={(value) => <StatusBadge status={value as any} />}
                        />
                      </TableCell>
                      <TableCell>
                        {task.is_team_task ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <span className="text-sm">Time Hiro</span>
                          </div>
                        ) : task.assignee_name ? (
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
                        <InlineDateCell
                          value={task.due_date}
                          onSave={(newDate) => updateMyTask.mutate({ 
                            id: task.id, 
                            updates: { due_date: newDate } 
                          })}
                        />
                      </TableCell>
                        <TableCell>
                          {task.department || <span className="text-muted-foreground text-sm">-</span>}
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
                  <TableRow className="border-dashed hover:bg-transparent">
                    <TableCell colSpan={7}>
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Nova tarefa pessoal..."
                          value={newMyTaskTitle}
                          onChange={(e) => setNewMyTaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCreateInlineTask(newMyTaskTitle, false, () => setNewMyTaskTitle(''));
                            }
                          }}
                          onBlur={() => {
                            if (newMyTaskTitle.trim()) {
                              handleCreateInlineTask(newMyTaskTitle, false, () => setNewMyTaskTitle(''));
                            }
                          }}
                          className="h-8 border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/60"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
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
