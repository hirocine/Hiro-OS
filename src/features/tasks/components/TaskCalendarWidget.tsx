import { useState, useMemo } from 'react';
import { format, isSameDay, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, Lock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTasks } from '../hooks/useTasks';
import { PriorityBadge, StatusBadge } from './index';

// Parse date string to local timezone (prevents UTC rollback issue)
const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

interface TaskCalendarWidgetProps {
  isPrivate?: boolean;
}

export function TaskCalendarWidget({ isPrivate }: TaskCalendarWidgetProps) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [month, setMonth] = useState<Date>(new Date());
  
  const { tasks } = useTasks({ is_private: isPrivate });

  // Group active tasks by date (exclude completed and archived)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    
    // Filter out completed and archived tasks
    const activeTasks = tasks?.filter(t => 
      t.status !== 'concluida' && t.status !== 'arquivada'
    ) || [];
    
    activeTasks.forEach(task => {
      if (task.due_date) {
        const dateKey = task.due_date.split('T')[0]; // Use date string directly
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
      const date = parseLocalDate(dateKey);
      const hasUrgent = dayTasks.some(t => t.priority === 'urgente' && t.status !== 'concluida');
      const hasOverdue = dayTasks.some(t => {
        const dueDate = parseLocalDate(t.due_date!.split('T')[0]);
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
                    const pendingCount = dayTasks.length;
                    const hasOverdue = dayTasks.some(t => {
                      const dueDate = parseLocalDate(t.due_date!.split('T')[0]);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return dueDate < today;
                    });
                    const hasUrgent = dayTasks.some(t => t.priority === 'urgente');
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
            
            <ScrollArea className="flex-1 h-[320px]">
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
                  {selectedDateTasks.map((task, index) => {
                    // Calculate due date label
                    const getDueDateLabel = () => {
                      if (!task.due_date) return null;
                      const due = parseLocalDate(task.due_date.split('T')[0]);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      due.setHours(0, 0, 0, 0);
                      const diffDays = differenceInDays(due, today);
                      
                      if (diffDays < 0) return { text: `Atrasada há ${Math.abs(diffDays)} dia${Math.abs(diffDays) > 1 ? 's' : ''}`, isOverdue: true, isUrgent: false };
                      if (diffDays === 0) return { text: 'Termina hoje', isOverdue: false, isUrgent: true };
                      if (diffDays === 1) return { text: 'Termina amanhã', isOverdue: false, isUrgent: true };
                      return { text: `Termina em ${diffDays} dias`, isOverdue: false, isUrgent: false };
                    };
                    
                    const dueDateInfo = getDueDateLabel();
                    const isOverdue = dueDateInfo?.isOverdue;
                    
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "w-full p-4 rounded-xl border bg-card transition-all duration-200 text-left group",
                          "hover:shadow-md hover:border-primary/30 hover:bg-accent/30",
                          "animate-fade-in",
                          isOverdue && "border-destructive/30 bg-destructive/5"
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Row 1: Icon + Title + Assignee | Due Date Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {task.is_private ? (
                              <Lock className="w-4 h-4 text-purple-500 shrink-0" />
                            ) : (
                              <Users className="w-4 h-4 text-primary shrink-0" />
                            )}
                            <p className="font-medium text-sm md:text-base truncate">
                              {task.title}
                            </p>
                            {task.assignee_name && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                                <Avatar className="w-5 h-5">
                                  {task.assignee_avatar ? (
                                    <AvatarImage src={task.assignee_avatar} />
                                  ) : null}
                                  <AvatarFallback className="text-[8px] bg-muted">
                                    {task.assignee_name.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate max-w-[80px]">{task.assignee_name.split(' ')[0]}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Due date badge - top right */}
                          {dueDateInfo && (
                            <Badge 
                              variant="outline"
                              className={cn(
                                "text-[10px] px-2 py-0.5 h-5 shrink-0 whitespace-nowrap",
                                dueDateInfo.isOverdue && "text-destructive bg-destructive/10 border-destructive/30",
                                dueDateInfo.isUrgent && "text-yellow-600 bg-yellow-500/10 border-yellow-500/30",
                                !dueDateInfo.isOverdue && !dueDateInfo.isUrgent && "text-muted-foreground bg-muted border-border"
                              )}
                            >
                              {dueDateInfo.text}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Row 2: Priority + Status Badges | Ver Button */}
                        <div className="flex items-center justify-between mt-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <PriorityBadge priority={task.priority} />
                            <StatusBadge status={task.status} />
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/tarefas/${task.id}`)}
                            className="h-7 px-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
