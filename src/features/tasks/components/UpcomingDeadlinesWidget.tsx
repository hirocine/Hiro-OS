import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useTasks } from '../hooks/useTasks';
import { differenceInDays, format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';

export function UpcomingDeadlinesWidget() {
  const navigate = useNavigate();
  const { tasks, isLoading } = useTasks();
  
  const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Filter tasks with due dates in the next 7 days
  const upcomingTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = addDays(today, 7);

    return tasks
      .filter(t => {
        if (!t.due_date) return false;
        if (t.status === 'concluida' || t.status === 'arquivada') return false;
        const due = parseLocalDate(t.due_date);
        return due >= today && due <= nextWeek;
      })
      .sort((a, b) => {
        const dateA = parseLocalDate(a.due_date!);
        const dateB = parseLocalDate(b.due_date!);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 5);
  }, [tasks]);

  const getDaysLabel = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = parseLocalDate(dueDate);
    const diffDays = differenceInDays(due, today);
    
    if (diffDays === 0) return { text: 'Hoje', variant: 'destructive' as const };
    if (diffDays === 1) return { text: 'Amanhã', variant: 'warning' as const };
    return { text: `${diffDays} dias`, variant: 'secondary' as const };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <CalendarDays className="w-4 h-4 text-primary" />
          </div>
          <CardTitle className="text-base">Próximas Entregas</CardTitle>
        </div>
        {upcomingTasks.length > 0 && (
          <Button variant="ghost" size="sm" asChild>
            <Link to="/tarefas/todas">
              Ver todas <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : upcomingTasks.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            Nenhuma entrega nos próximos 7 dias
          </p>
        ) : (
          <div className="space-y-2">
            {upcomingTasks.map(task => {
              const daysLabel = getDaysLabel(task.due_date!);
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/tarefas/${task.id}`)}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm truncate">{task.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(parseLocalDate(task.due_date!), "dd 'de' MMM", { locale: ptBR })}
                    </span>
                  </div>
                  <Badge 
                    variant={daysLabel.variant === 'warning' ? 'outline' : daysLabel.variant}
                    className={daysLabel.variant === 'warning' ? 'border-yellow-500 text-yellow-600 bg-yellow-500/10' : ''}
                  >
                    {daysLabel.text}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
