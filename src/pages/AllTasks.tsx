import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PriorityBadge } from '@/features/tasks/components/PriorityBadge';
import { StatusBadge } from '@/features/tasks/components/StatusBadge';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AllTasks() {
  const navigate = useNavigate();
  const { tasks, isLoading } = useTasks();

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
          <CardTitle>Todas as Tarefas</CardTitle>
          <CardDescription>Todas as tarefas da plataforma ({tasks.length})</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma tarefa ainda</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Departamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
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
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm">
                            {format(new Date(task.due_date), 'dd/MM/yyyy', { locale: ptBR })}
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
