import { useNavigate } from 'react-router-dom';
import { Film, CheckSquare, Video, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { usePostProduction } from '@/features/post-production/hooks/usePostProduction';
import { PP_PRIORITY_ORDER, PP_PRIORITY_CONFIG } from '@/features/post-production/types';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { useRecordingsToday, getEventTitle } from '@/hooks/useRecordingsCalendar';
import { useAuthContext } from '@/contexts/AuthContext';

const today = new Date().toLocaleDateString('en-CA');

export default function TodayWidgets() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { items } = usePostProduction();
  const { tasks } = useTasks();
  const { data: recordingEvents = [], isLoading: recordingsLoading } = useRecordingsToday();

  // Entregas hoje
  const todayDeliveries = items
    .filter(i => i.due_date === today && i.status !== 'entregue')
    .sort((a, b) => PP_PRIORITY_ORDER[b.priority] - PP_PRIORITY_ORDER[a.priority]);

  // Minhas tarefas
  const myTasks = tasks
    .filter(t => t.status !== 'concluida' && t.status !== 'arquivada' && t.assignees?.some(a => a.user_id === user?.id))
    .sort((a, b) => {
      const aToday = a.due_date === today ? 0 : 1;
      const bToday = b.due_date === today ? 0 : 1;
      return aToday - bToday;
    });

  // Gravações do dia
  

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Entregas hoje */}
      <Card
        className="hover:shadow-md transition-shadow cursor-pointer group"
        onClick={() => navigate('/esteira-de-pos')}
      >
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Film className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Entregas hoje</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="mb-3">
            <span className="text-3xl font-bold">{todayDeliveries.length}</span>
            <p className="text-sm text-muted-foreground">vídeo(s) para entregar</p>
          </div>
          {todayDeliveries.length > 0 ? (
            <>
              <Separator className="mb-3" />
              <div className="space-y-2">
                {todayDeliveries.slice(0, 3).map(item => (
                  <div key={item.id} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-sm truncate flex-1">{item.title}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${PP_PRIORITY_CONFIG[item.priority].color}`}>
                      {PP_PRIORITY_CONFIG[item.priority].label}
                    </Badge>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <Separator className="mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma entrega para hoje</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Minhas tarefas */}
      <Card
        className="hover:shadow-md transition-shadow cursor-pointer group"
        onClick={() => navigate('/tarefas')}
      >
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <CheckSquare className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Minhas tarefas</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="mb-3">
            <span className="text-3xl font-bold">{myTasks.length}</span>
            <p className="text-sm text-muted-foreground">tarefa(s) pendente(s)</p>
          </div>
          {myTasks.length > 0 ? (
            <>
              <Separator className="mb-3" />
              <div className="space-y-2">
                {myTasks.slice(0, 3).map(task => (
                  <div key={task.id} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-sm truncate flex-1">{task.title}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 text-muted-foreground">
                      {task.due_date === today
                        ? 'hoje'
                        : task.due_date
                          ? format(parseISO(task.due_date), 'dd/MM')
                          : '—'}
                    </Badge>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <Separator className="mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma tarefa pendente</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Gravações do dia */}
      <Card
        className="hover:shadow-md transition-shadow cursor-pointer group"
        onClick={() => navigate('/retiradas')}
      >
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Video className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Gravações do dia</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="mb-3">
            <span className="text-3xl font-bold">{todayRecordings.length}</span>
            <p className="text-sm text-muted-foreground">gravação(ões) agendada(s)</p>
          </div>
          {todayRecordings.length > 0 ? (
            <>
              <Separator className="mb-3" />
              <div className="space-y-2">
                {todayRecordings.slice(0, 3).map(proj => (
                  <div key={proj.id} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    <span className="text-sm truncate flex-1">{proj.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {proj.responsibleName?.split(' ')[0] || '—'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <Separator className="mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma gravação agendada</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
