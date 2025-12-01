import { History, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useTaskHistory } from '../hooks/useTaskHistory';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskHistorySectionProps {
  taskId: string;
}

export function TaskHistorySection({ taskId }: TaskHistorySectionProps) {
  const { history, isLoading } = useTaskHistory(taskId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-muted">
              <History className="h-5 w-5 text-muted-foreground" />
            </div>
            Histórico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-muted">
            <History className="h-5 w-5 text-muted-foreground" />
          </div>
          Histórico
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma ação registrada ainda
          </p>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <p className="text-sm font-medium text-foreground">
                    {entry.action}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{entry.user_name}</span>
                    <span>•</span>
                    <span>
                      {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
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
