import { useState, useMemo } from 'react';
import { format, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    urgent: {
      position: 'relative' as const,
    },
    overdue: {
      position: 'relative' as const,
    },
    normal: {
      position: 'relative' as const,
    },
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <CalendarIcon className="h-5 w-5 text-primary" />
          </div>
          <CardTitle>Calendário de Tarefas</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="flex flex-col">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              month={month}
              onMonthChange={setMonth}
              locale={ptBR}
              className="rounded-md border pointer-events-auto w-full"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                month: "space-y-4 w-full",
                table: "w-full border-collapse",
                head_row: "flex w-full",
                head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] text-center",
                row: "flex w-full mt-2",
                cell: "flex-1 h-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-10 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "day-outside text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border rounded-md",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                caption: "flex justify-center pt-1 relative items-center h-10",
                caption_label: "text-sm font-medium",
              }}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              components={{
                DayContent: ({ date }) => {
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const dayTasks = tasksByDate.get(dateKey) || [];
                  const hasUrgent = dayTasks.some(t => t.priority === 'urgente' && t.status !== 'concluida');
                  const hasOverdue = dayTasks.some(t => {
                    const dueDate = new Date(t.due_date!);
                    return dueDate < new Date() && t.status !== 'concluida';
                  });
                  const hasNormal = dayTasks.some(t => t.status !== 'concluida');
                  
                  return (
                    <div className="relative flex flex-col items-center justify-center w-full h-full">
                      <span>{date.getDate()}</span>
                      {dayTasks.length > 0 && (
                        <div className="absolute bottom-0.5 flex gap-0.5">
                          {hasOverdue && <div className="w-1.5 h-1.5 rounded-full bg-destructive" />}
                          {hasUrgent && !hasOverdue && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                          {hasNormal && !hasOverdue && !hasUrgent && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </div>
                      )}
                    </div>
                  );
                },
              }}
            />
            
            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-destructive" />
                <span>Atrasada</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>Urgente</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>Normal</span>
              </div>
            </div>
          </div>

          {/* Task list for selected date */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm">
                {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
              </h4>
              <Badge variant="secondary" className="text-xs">
                {selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'tarefa' : 'tarefas'}
              </Badge>
            </div>
            
            <ScrollArea className="flex-1 h-[280px] pr-3">
              {selectedDateTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                  <CalendarIcon className="h-8 w-8 mb-2 opacity-50" />
                  <p>Nenhuma tarefa para este dia</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDateTasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => navigate(`/tarefas/${task.id}`)}
                      className="w-full p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <PriorityBadge priority={task.priority} />
                            <StatusBadge status={task.status} />
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
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
