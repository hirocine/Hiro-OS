import { useState, useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTasks } from '../hooks/useTasks';
import { PriorityBadge, StatusBadge } from './index';

export function TaskCalendarWidget() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [month, setMonth] = useState<Date>(new Date());
  
  const { tasks } = useTasks({});

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    
    tasks?.forEach(task => {
      if (task.due_date) {
        const dateKey = format(new Date(task.due_date), 'yyyy-MM-dd');
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, task]);
      }
    });
    
    return map;
  }, [tasks]);

  // Tasks for selected date
  const selectedDateTasks = useMemo(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return tasksByDate.get(dateKey) || [];
  }, [selectedDate, tasksByDate]);

  // Modifier for days with tasks
  const modifiers = useMemo(() => {
    const urgent: Date[] = [];
    const overdue: Date[] = [];
    const normal: Date[] = [];
    const today = new Date();

    tasksByDate.forEach((dayTasks, dateKey) => {
      const date = new Date(dateKey);
      const hasUrgent = dayTasks.some(t => t.priority === 'urgente' && t.status !== 'concluida');
      const hasOverdue = dayTasks.some(t => {
        const dueDate = new Date(t.due_date!);
        return dueDate < today && t.status !== 'concluida';
      });
      
      if (hasOverdue) {
        overdue.push(date);
      } else if (hasUrgent) {
        urgent.push(date);
      } else if (dayTasks.some(t => t.status !== 'concluida')) {
        normal.push(date);
      }
    });

    return { urgent, overdue, normal };
  }, [tasksByDate]);

  const modifiersStyles = {
    urgent: { position: 'relative' as const },
    overdue: { position: 'relative' as const },
    normal: { position: 'relative' as const },
  };

  return (
    <Card className="col-span-full overflow-hidden">
      <CardHeader className="pb-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 shadow-sm">
            <CalendarIcon className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg">Calendário de Tarefas</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar */}
          <div className="flex flex-col">
            <div className="bg-card rounded-xl border shadow-sm p-5">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                month={month}
                onMonthChange={setMonth}
                locale={ptBR}
                className="pointer-events-auto w-full"
                classNames={{
                  months: "flex flex-col w-full",
                  month: "space-y-6 w-full",
                  table: "w-full border-collapse",
                  head_row: "flex w-full bg-muted/40 rounded-lg py-2 mb-3",
                  head_cell: "text-muted-foreground flex-1 font-semibold text-xs uppercase tracking-wider text-center",
                  row: "flex w-full mt-1",
                  cell: "flex-1 h-12 md:h-14 text-center text-sm p-0.5 relative focus-within:relative focus-within:z-20",
                  day: "h-full w-full p-0 font-medium rounded-lg transition-all duration-200 hover:bg-accent/70 hover:scale-[1.02] aria-selected:opacity-100",
                  day_selected: "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105 hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-muted/50 font-semibold",
                  day_outside: "text-muted-foreground/40 opacity-50",
                  day_disabled: "text-muted-foreground opacity-30",
                  nav: "space-x-2 flex items-center",
                  nav_button: "h-9 w-9 bg-muted/50 hover:bg-muted rounded-lg transition-all duration-200 flex items-center justify-center hover:scale-105",
                  nav_button_previous: "absolute left-0",
                  nav_button_next: "absolute right-0",
                  caption: "flex justify-center pt-1 pb-2 relative items-center h-12",
                  caption_label: "text-base md:text-lg font-semibold capitalize",
                }}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                components={{
                  IconLeft: () => <ChevronLeft className="h-5 w-5" />,
                  IconRight: () => <ChevronRight className="h-5 w-5" />,
                  DayContent: ({ date }) => {
                    const dateKey = format(date, 'yyyy-MM-dd');
                    const dayTasks = tasksByDate.get(dateKey) || [];
                    const pendingTasks = dayTasks.filter(t => t.status !== 'concluida' && t.status !== 'arquivada');
                    const pendingCount = pendingTasks.length;
                    const hasOverdue = pendingTasks.some(t => {
                      const dueDate = new Date(t.due_date!);
                      return dueDate < new Date() && t.status !== 'concluida';
                    });
                    const hasUrgent = pendingTasks.some(t => t.priority === 'urgente');
                    const isToday = isSameDay(date, new Date());
                    
                    return (
                      <div className={cn(
                        "group relative flex flex-col items-center justify-center w-full h-full rounded-lg transition-colors",
                        pendingCount > 0 && !isToday && "bg-primary/5"
                      )}>
                        <span className="text-sm md:text-base">{date.getDate()}</span>
                        {pendingCount > 0 && (
                          <span className={cn(
                            "absolute -top-0.5 -right-0.5 flex items-center justify-center",
                            "min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold",
                            "shadow-sm transition-transform group-hover:scale-110",
                            hasOverdue && "bg-destructive text-white shadow-destructive/40",
                            hasUrgent && !hasOverdue && "bg-orange-500 text-white shadow-orange-500/40",
                            !hasOverdue && !hasUrgent && "bg-background border border-border text-foreground"
                          )}>
                            {pendingCount}
                          </span>
                        )}
                      </div>
                    );
                  },
                }}
              />
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center min-w-[16px] h-[16px] rounded-full bg-destructive text-[9px] font-bold text-white">2</span>
                <span className="text-muted-foreground font-medium">Atrasada</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center min-w-[16px] h-[16px] rounded-full bg-orange-500 text-[9px] font-bold text-white">3</span>
                <span className="text-muted-foreground font-medium">Urgente</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center min-w-[16px] h-[16px] rounded-full bg-background border border-border text-[9px] font-bold text-foreground">1</span>
                <span className="text-muted-foreground font-medium">Normal</span>
              </div>
            </div>
          </div>

          {/* Task list for selected date */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-1 rounded-full bg-primary" />
                <h4 className="font-semibold text-base md:text-lg capitalize">
                  {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                </h4>
              </div>
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs font-semibold px-3 py-1",
                  selectedDateTasks.length > 0 && "bg-primary/10 text-primary border-primary/20"
                )}
              >
                {selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'tarefa' : 'tarefas'}
              </Badge>
            </div>
            
            <ScrollArea className="flex-1 h-[320px] pr-4">
              {selectedDateTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                  <div className="p-4 rounded-2xl bg-muted/30 mb-4">
                    <CalendarIcon className="h-10 w-10 opacity-40" />
                  </div>
                  <p className="text-sm font-medium">Nenhuma tarefa para este dia</p>
                  <p className="text-xs mt-1 opacity-70">Selecione outro dia no calendário</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateTasks.map((task, index) => (
                    <button
                      key={task.id}
                      onClick={() => navigate(`/tarefas/${task.id}`)}
                      className={cn(
                        "w-full p-4 rounded-xl border bg-card transition-all duration-200 text-left group",
                        "hover:shadow-md hover:border-primary/30 hover:bg-accent/30 hover:-translate-y-0.5",
                        "animate-fade-in"
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm md:text-base truncate group-hover:text-primary transition-colors">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <PriorityBadge priority={task.priority} />
                            <StatusBadge status={task.status} />
                          </div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors shrink-0">
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
