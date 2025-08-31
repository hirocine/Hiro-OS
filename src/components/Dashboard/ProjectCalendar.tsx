import React, { useState, useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, isSameMonth, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DayProject {
  id: string;
  name: string;
  status: string;
  step: string;
  isStart: boolean;
  isEnd: boolean;
  isActive: boolean;
  color: string;
}

export function ProjectCalendar() {
  const { projects } = useProjects();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd
    });
  }, [currentMonth]);

  // Process projects for each day
  const dayProjects = useMemo(() => {
    const dayProjectsMap = new Map<string, DayProject[]>();

    projects.forEach(project => {
      const startDate = project.separationDate || project.startDate;
      const endDate = project.actualEndDate || project.expectedEndDate;
      
      if (!startDate || !endDate) return;

      const projectStart = new Date(startDate);
      const projectEnd = new Date(endDate);

      // Get project color based on status
      const getProjectColor = () => {
        switch (project.status) {
          case 'completed':
            return 'hsl(var(--success))';
          case 'active':
            return project.actualEndDate ? 'hsl(var(--success))' : 'hsl(var(--primary))';
          case 'archived':
            return 'hsl(var(--muted))';
          default:
            return 'hsl(var(--primary))';
        }
      };

      // Add project to each day it spans
      calendarDays.forEach(day => {
        if (day >= projectStart && day <= projectEnd && isSameMonth(day, currentMonth)) {
          const dayKey = format(day, 'yyyy-MM-dd');
          
          if (!dayProjectsMap.has(dayKey)) {
            dayProjectsMap.set(dayKey, []);
          }

          dayProjectsMap.get(dayKey)!.push({
            id: project.id,
            name: project.name,
            status: project.status,
            step: project.step,
            isStart: isSameDay(day, projectStart),
            isEnd: isSameDay(day, projectEnd),
            isActive: day >= projectStart && day <= projectEnd,
            color: getProjectColor()
          });
        }
      });
    });

    return dayProjectsMap;
  }, [projects, currentMonth, calendarDays]);

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  return (
    <div className="bg-gradient-card rounded-lg p-6 shadow-elegant">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Calendário de Projetos</h2>
            <p className="text-sm text-muted-foreground">
              Cronograma mensal dos projetos
            </p>
          </div>
        </div>
        
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[160px] text-center">
            <span className="font-medium">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
        {weekDays.map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayProjs = dayProjects.get(dayKey) || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);

          return (
            <div 
              key={dayKey}
              className={`min-h-[80px] p-2 border border-border rounded-md ${
                isCurrentMonth ? 'bg-card' : 'bg-muted/20'
              } ${isCurrentDay ? 'ring-2 ring-primary' : ''}`}
            >
              {/* Day number */}
              <div className={`text-sm mb-1 ${
                isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
              } ${isCurrentDay ? 'font-bold text-primary' : ''}`}>
                {format(day, 'd')}
              </div>

              {/* Project bars */}
              <div className="space-y-1">
                {dayProjs.slice(0, 3).map((project) => (
                  <TooltipProvider key={project.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="h-2 rounded-full cursor-pointer transition-opacity hover:opacity-80"
                          style={{ backgroundColor: project.color }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p className="font-medium text-xs">{project.name}</p>
                          <div className="flex gap-1">
                            {project.isStart && (
                              <Badge variant="secondary" className="text-xs">Início</Badge>
                            )}
                            {project.isEnd && (
                              <Badge variant="outline" className="text-xs">Fim</Badge>
                            )}
                          </div>
                          <p className="text-xs">
                            Status: {project.status === 'active' ? 'Ativo' : 
                                    project.status === 'completed' ? 'Finalizado' : 'Arquivado'}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                
                {/* Show count if more than 3 projects */}
                {dayProjs.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayProjs.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border">
        <h4 className="font-medium text-sm mb-3">Legenda</h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }} />
            <span>Projeto Ativo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--success))' }} />
            <span>Projeto Finalizado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--muted))' }} />
            <span>Projeto Arquivado</span>
          </div>
        </div>
      </div>
    </div>
  );
}