import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowRight } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRecentActivity } from '../hooks/useRecentActivity';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function RecentActivityWidget() {
  const navigate = useNavigate();
  const { data: activities, isLoading } = useRecentActivity(8);

  const getActionText = (action: string, fieldChanged?: string | null) => {
    if (action === 'created') return 'criou';
    if (action === 'status_changed') return 'atualizou o status de';
    if (action === 'priority_changed') return 'atualizou a prioridade de';
    if (action === 'assigned') return 'atribuiu';
    if (action === 'comment_added') return 'comentou em';
    if (action === 'subtask_added') return 'adicionou subtarefa em';
    if (action === 'subtask_completed') return 'concluiu subtarefa em';
    if (fieldChanged) return `atualizou ${fieldChanged} de`;
    return 'atualizou';
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Activity className="w-4 h-4 text-purple-500" />
          </div>
          <CardTitle className="text-base">Atividade Recente</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : !activities || activities.length === 0 ? (
          <EmptyState icon={Activity} title="" description="Nenhuma atividade recente." compact />
        ) : (
          <ScrollArea className="h-[260px] pr-4">
            <div className="space-y-3">
              {activities.map(activity => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/tarefas/${activity.task_id}`)}
                >
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="text-xs">
                      {activity.user_name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user_name?.split(' ')[0]}</span>
                      {' '}{getActionText(activity.action, activity.field_changed)}{' '}
                      <span className="text-primary font-medium truncate">
                        "{activity.task_title}"
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
