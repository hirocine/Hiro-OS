import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { Task } from '../types';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, addWeeks, subMonths, subWeeks,
  isSameMonth, isToday, eachDayOfInterval, startOfDay,
  isSameWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskCalendarViewProps {
  tasks: Task[];
  isLoading?: boolean;
}

const PRIORITY_PILL: Record<string, string> = {
  urgente: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  alta: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  media: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  baixa: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  standby: 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400',
};

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export function TaskCalendarView({ tasks, isLoading }: TaskCalendarViewProps) {
  const navigate = useNavigate();
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [animKey, setAnimKey] = useState(0);

  const activeTasks = useMemo(() =>
    tasks.filter(t => t.status !== 'concluida' && t.status !== 'arquivada' && t.due_date),
    [tasks]
  );

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    activeTasks.forEach(task => {
      if (task.due_date) {
        const dateKey = task.due_date.split('T')[0];
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, task]);
      }
    });
    return map;
  }, [activeTasks]);

  const getTasksForDay = (day: Date): Task[] => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return tasksByDate.get(dateKey) || [];
  };

  const periodLabel = useMemo(() => {
    if (view === 'month') return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    if (view === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 0 });
      const we = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(ws, 'dd MMM', { locale: ptBR })} – ${format(we, 'dd MMM yyyy', { locale: ptBR })}`;
    }
    return 'Próximas tarefas';
  }, [view, currentDate]);

  const navigatePeriod = (dir: 1 | -1) => {
    if (view === 'month') setCurrentDate(d => dir === 1 ? addMonths(d, 1) : subMonths(d, 1));
    else if (view === 'week') setCurrentDate(d => dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1));
    setAnimKey(k => k + 1);
  };

  const calendarDays = useMemo(() => {
    if (view === 'month') {
      const mStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
      const mEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
      return eachDayOfInterval({ start: mStart, end: mEnd });
    }
    if (view === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 0 });
      const we = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start: ws, end: we });
    }
    return [];
  }, [view, currentDate]);

  const groupTasksForList = useMemo(() => {
    const today = new Date();
    const sorted = [...activeTasks].sort((a, b) => {
      const da = a.due_date ? parseLocalDate(a.due_date).getTime() : Infinity;
      const db = b.due_date ? parseLocalDate(b.due_date).getTime() : Infinity;
      return da - db;
    });

    const groups: { label: string; tasks: Task[] }[] = [
      { label: 'Atrasadas', tasks: [] },
      { label: 'Esta semana', tasks: [] },
      { label: 'Próxima semana', tasks: [] },
      { label: 'Este mês', tasks: [] },
      { label: 'Futuras', tasks: [] },
    ];

    const nextWeekStart = addWeeks(startOfWeek(today, { weekStartsOn: 0 }), 1);

    sorted.forEach(task => {
      if (!task.due_date) return;
      const d = parseLocalDate(task.due_date);
      const todayStart = startOfDay(today);
      if (d < todayStart) groups[0].tasks.push(task);
      else if (isSameWeek(d, today, { weekStartsOn: 0 })) groups[1].tasks.push(task);
      else if (isSameWeek(d, nextWeekStart, { weekStartsOn: 0 })) groups[2].tasks.push(task);
      else if (isSameMonth(d, today)) groups[3].tasks.push(task);
      else groups[4].tasks.push(task);
    });

    return groups.filter(g => g.tasks.length > 0);
  }, [activeTasks]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Calendário de Tarefas</h3>
              <p className="text-xs text-muted-foreground">
                {activeTasks.length} tarefas ativas com prazo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {view !== 'list' && (
              <div className="flex items-center gap-1 mr-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2.5 mr-1"
                  onClick={() => { setCurrentDate(new Date()); setAnimKey(k => k + 1); }}
                >
                  Hoje
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigatePeriod(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[160px] text-center capitalize">{periodLabel}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigatePeriod(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
              {(['month', 'week', 'list'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => { setView(v); setAnimKey(k => k + 1); }}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-md transition-all font-medium',
                    view === v
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : 'Lista'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div key={animKey} className="animate-in fade-in-0 duration-200">
          {/* MONTH VIEW */}
          {view === 'month' && (
            <div>
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAY_LABELS.map(d => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {calendarDays.map((day, idx) => {
                  const sameMonth = isSameMonth(day, currentDate);
                  const dayTasks = sameMonth ? getTasksForDay(day) : [];
                  const today = isToday(day);
                  return (
                    <div
                      key={idx}
                      className={cn(
                        'min-h-[80px] p-1.5 bg-card transition-colors',
                        !sameMonth && 'bg-muted/30',
                      )}
                    >
                      {today ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                          {format(day, 'd')}
                        </span>
                      ) : (
                        <span className={cn('text-xs', !sameMonth ? 'text-muted-foreground/40' : 'text-muted-foreground')}>
                          {format(day, 'd')}
                        </span>
                      )}
                      <div className="mt-1 space-y-0.5">
                        {dayTasks.slice(0, 2).map(task => (
                          <div
                            key={task.id}
                            onClick={(e) => { e.stopPropagation(); navigate(`/tarefas/${task.id}`); }}
                            className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded truncate w-full cursor-pointer font-medium',
                              PRIORITY_PILL[task.priority] || PRIORITY_PILL.standby
                            )}
                          >
                            {task.title}
                          </div>
                        ))}
                        {dayTasks.length > 2 && (
                          <span className="text-[9px] text-muted-foreground pl-1">+{dayTasks.length - 2} mais</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WEEK VIEW */}
          {view === 'week' && (
            <div className="space-y-2">
              {calendarDays.map((day, idx) => {
                const dayTasks = getTasksForDay(day);
                const today = isToday(day);
                return (
                  <div
                    key={idx}
                    className={cn(
                      'flex gap-4 p-3 rounded-lg border',
                      today && 'border-primary/40 bg-primary/5'
                    )}
                  >
                    <div className="text-center min-w-[48px]">
                      <p className="text-xs text-muted-foreground font-medium">{WEEKDAY_LABELS[day.getDay()]}</p>
                      <p className={cn('text-lg font-bold', today ? 'text-primary' : 'text-foreground')}>
                        {format(day, 'd')}
                      </p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {dayTasks.length === 0 && (
                        <p className="text-xs text-muted-foreground py-1">Sem tarefas</p>
                      )}
                      {dayTasks.map(task => {
                        const borderColor =
                          task.priority === 'urgente' ? 'border-l-red-500' :
                          task.priority === 'alta' ? 'border-l-orange-500' :
                          task.priority === 'media' ? 'border-l-yellow-500' :
                          task.priority === 'baixa' ? 'border-l-blue-500' :
                          'border-l-gray-400';
                        return (
                          <div
                            key={task.id}
                            onClick={() => navigate(`/tarefas/${task.id}`)}
                            className={cn('rounded-lg p-2 bg-muted/40 border-l-2 cursor-pointer hover:bg-muted/60 transition-colors', borderColor)}
                          >
                            <p className="text-sm font-medium truncate">{task.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {task.assignees?.[0]?.display_name?.split(' ')[0] || 'Sem responsável'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* LIST VIEW */}
          {view === 'list' && (
            <div className="space-y-6">
              {groupTasksForList.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma tarefa com prazo definido</p>
              ) : (
                groupTasksForList.map(group => (
                  <div key={group.label}>
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="text-sm font-semibold text-foreground">{group.label}</h4>
                      <Badge variant="secondary" className="text-xs">{group.tasks.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {group.tasks.map(task => {
                        const d = task.due_date ? parseLocalDate(task.due_date) : new Date();
                        return (
                          <div
                            key={task.id}
                            onClick={() => navigate(`/tarefas/${task.id}`)}
                            className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors"
                          >
                            <div className="text-center min-w-[40px] p-1.5 rounded-md bg-muted/50">
                              <p className="text-sm font-bold leading-none">{format(d, 'd')}</p>
                              <p className="text-[10px] text-muted-foreground capitalize">{format(d, 'MMM', { locale: ptBR })}</p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{task.title}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {task.assignees?.[0]?.display_name || 'Sem responsável'}
                                {task.department && ` · ${task.department}`}
                              </p>
                            </div>
                            <PriorityBadge priority={task.priority} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
