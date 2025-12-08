import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PriorityBadge } from './PriorityBadge';
import { useTasks } from '../hooks/useTasks';
import { differenceInDays } from 'date-fns';

export function UrgentTasksWidget() {
  const navigate = useNavigate();
  const { tasks, isLoading } = useTasks({ priority: 'urgente' });
  
  // Filter out completed/archived
  const urgentTasks = tasks
    .filter(t => t.status !== 'concluida' && t.status !== 'arquivada')
    .slice(0, 5);

  const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getDaysLabel = (dueDate: string | null) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = parseLocalDate(dueDate);
    const diffDays = differenceInDays(due, today);
    
    if (diffDays < 0) return { text: `${Math.abs(diffDays)}d atrasada`, className: 'text-destructive' };
    if (diffDays === 0) return { text: 'Hoje', className: 'text-yellow-600' };
    return { text: `${diffDays}d`, className: 'text-muted-foreground' };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <CardTitle className="text-base">Tarefas Urgentes</CardTitle>
        </div>
        {urgentTasks.length > 0 && (
          <Button variant="ghost" size="sm" asChild>
            <Link to="/tarefas/todas?priority=urgente">
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
        ) : urgentTasks.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            Nenhuma tarefa urgente 🎉
          </p>
        ) : (
          <div className="space-y-2">
            {urgentTasks.map(task => {
              const daysLabel = getDaysLabel(task.due_date);
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/tarefas/${task.id}`)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                    <span className="text-sm truncate">{task.title}</span>
                  </div>
                  {daysLabel && (
                    <span className={`text-xs shrink-0 ${daysLabel.className}`}>
                      {daysLabel.text}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
