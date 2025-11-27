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
import { InlineAssigneeCell } from '@/features/tasks/components/InlineAssigneeCell';
import { InlineDepartmentCell } from '@/features/tasks/components/InlineDepartmentCell';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { useDepartments } from '@/features/tasks/hooks/useDepartments';
import { useUsers } from '@/hooks/useUsers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import type { TaskPriority, TaskStatus } from '@/features/tasks/types';

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
  
  const { tasks: teamTasks, isLoading: teamLoading, updateTask: updateTeamTask, createTask } = useTasks();
  const { tasks: myTasks, isLoading: myLoading, updateTask: updateMyTask } = useTasks({ assigned_to_me: true });

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
              <CardTitle>Todas as Tarefas</CardTitle>
              <CardDescription>Todas as tarefas da plataforma</CardDescription>
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
              ) : displayedTeamTasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma tarefa ainda</p>
              ) : (
                <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[22%] text-left">Título</TableHead>
                    <TableHead className="w-[10%] text-left">Prioridade</TableHead>
                    <TableHead className="w-[12%] text-left">Status</TableHead>
                    <TableHead className="w-[18%] text-left">Responsável</TableHead>
                    <TableHead className="w-[16%] text-left">Prazo</TableHead>
                    <TableHead className="w-[14%] text-left">Departamento</TableHead>
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
                      <InlineDepartmentCell
                        value={task.department}
                        departments={departments}
                        onSave={(newDept) => updateTeamTask.mutate({ 
                          id: task.id, 
                          updates: { department: newDept } 
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
                      onSave={(newValue, isTeamTask) => {
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
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[22%] text-left">Título</TableHead>
                    <TableHead className="w-[10%] text-left">Prioridade</TableHead>
                    <TableHead className="w-[12%] text-left">Status</TableHead>
                    <TableHead className="w-[18%] text-left">Responsável</TableHead>
                    <TableHead className="w-[16%] text-left">Prazo</TableHead>
                    <TableHead className="w-[14%] text-left">Departamento</TableHead>
                    <TableHead className="w-[8%] text-left">Ações</TableHead>
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
                          <InlineDepartmentCell
                            value={task.department}
                            departments={departments}
                            onSave={(newDept) => updateMyTask.mutate({ 
                              id: task.id, 
                              updates: { department: newDept } 
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
                        onSave={(newValue, isTeamTask) => {
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
      </div>

      {/* Task Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </ResponsiveContainer>
  );
}
