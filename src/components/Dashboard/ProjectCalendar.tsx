import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameMonth, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useProjects } from '@/hooks/useProjects';
import { Project, ProjectStep } from '@/types/project';
import { stepColors, stepLabels, stepIcons } from '@/lib/projectSteps';

interface ProjectBar {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  step: ProjectStep;
  color: string;
  week: number;
  startDay: number;
  span: number;
  track: number;
  project: Project;
}

export const ProjectCalendar: React.FC = () => {
  const { projects, loading } = useProjects();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Calculate calendar structure
  const calendarStructure = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd
    });

    // Group days into weeks
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return { days, weeks };
  }, [currentMonth]);

  // Process projects into bars with improved logic
  const projectBars = useMemo(() => {
    if (!projects.length) return { bars: [], maxTracks: 0 };

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    // Filter projects that intersect with current month
    const relevantProjects = projects.filter(project => {
      const startDate = parseISO(project.startDate);
      const endDate = project.actualEndDate 
        ? parseISO(project.actualEndDate) 
        : parseISO(project.expectedEndDate);
      
      return startDate <= monthEnd && endDate >= monthStart;
    });

    const bars: ProjectBar[] = [];
    const weekTracks: { [weekIndex: number]: ProjectBar[] } = {};
    let maxTracks = 0;

    relevantProjects.forEach(project => {
      const startDate = parseISO(project.startDate);
      const endDate = project.actualEndDate 
        ? parseISO(project.actualEndDate) 
        : parseISO(project.expectedEndDate);

      // Process each week the project spans
      calendarStructure.weeks.forEach((week, weekIndex) => {
        const weekStart = week[0];
        const weekEnd = week[6];

        // Check if project intersects with this week
        if (startDate <= weekEnd && endDate >= weekStart) {
          const weekProjectStart = new Date(Math.max(startDate.getTime(), weekStart.getTime()));
          const weekProjectEnd = new Date(Math.min(endDate.getTime(), weekEnd.getTime()));

          const startDay = weekProjectStart.getDay();
          const endDay = weekProjectEnd.getDay();
          const span = endDay - startDay + 1;

          // Find available track for this week
          if (!weekTracks[weekIndex]) {
            weekTracks[weekIndex] = [];
          }

          // Find track that doesn't conflict
          let track = 0;
          let trackFound = false;

          while (!trackFound) {
            const conflict = weekTracks[weekIndex].some(existingBar => 
              existingBar.track === track &&
              ((existingBar.startDay <= startDay && existingBar.startDay + existingBar.span > startDay) ||
               (startDay <= existingBar.startDay && startDay + span > existingBar.startDay))
            );

            if (!conflict) {
              trackFound = true;
            } else {
              track++;
            }
          }

          const projectBar: ProjectBar = {
            id: `${project.id}-${weekIndex}`,
            name: project.name,
            startDate: weekProjectStart,
            endDate: weekProjectEnd,
            step: project.step,
            color: stepColors[project.step],
            week: weekIndex,
            startDay,
            span,
            track,
            project
          };

          bars.push(projectBar);
          weekTracks[weekIndex].push(projectBar);
          maxTracks = Math.max(maxTracks, track + 1);
        }
      });
    });

    return { bars, maxTracks };
  }, [projects, currentMonth, calendarStructure.weeks]);

  if (loading) {
    return (
      <Card className="bg-gradient-card shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendário de Projetos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-muted rounded-lg" />
            <div className="grid grid-cols-7 gap-3">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted/50 rounded-lg" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card shadow-elegant transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5 text-primary" />
            Calendário de Projetos
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('prev')}
              className="hover:bg-muted/50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="min-w-[180px] text-center">
              <h3 className="text-lg font-semibold capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h3>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('next')}
              className="hover:bg-muted/50 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Calendar Grid */}
        <div className="relative bg-card rounded-lg shadow-card overflow-hidden">
          {/* Week Headers */}
          <div className="grid grid-cols-7 bg-muted/30">
            {weekDays.map((day) => (
              <div 
                key={day} 
                className="p-3 text-center text-sm font-semibold text-muted-foreground border-r border-border/50 last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Weeks */}
          <div 
            className="relative"
            style={{ minHeight: `${320 + (projectBars.maxTracks * 28)}px` }}
          >
            {calendarStructure.weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 border-b border-border/30 last:border-b-0">
                {week.map((day) => {
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isCurrentDay = isToday(day);

                  return (
                    <div
                      key={format(day, 'yyyy-MM-dd')}
                      className={`
                        relative h-20 p-2 border-r border-border/30 last:border-r-0
                        transition-all duration-200 hover:bg-muted/20
                        ${isCurrentMonth 
                          ? isCurrentDay 
                            ? 'bg-primary/10 ring-1 ring-primary/50' 
                            : 'bg-background' 
                          : 'bg-muted/10'
                        }
                      `}
                    >
                      <div className={`
                        text-sm font-medium
                        ${isCurrentMonth 
                          ? isCurrentDay 
                            ? 'text-primary font-bold' 
                            : 'text-foreground' 
                          : 'text-muted-foreground'
                        }
                      `}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Project Bars Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {projectBars.bars.map((bar) => {
                const StepIcon = stepIcons[bar.step];
                
                return (
                  <Tooltip key={bar.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={`
                          absolute pointer-events-auto cursor-pointer rounded-md px-2 py-1
                          text-xs font-medium transition-all duration-200 
                          hover:scale-105 hover:shadow-md hover:z-30
                          flex items-center gap-1 ${bar.color}
                        `}
                        style={{
                          top: `${(bar.week * 80) + 24 + (bar.track * 24)}px`,
                          left: `${(bar.startDay / 7) * 100}%`,
                          width: `${(bar.span / 7) * 100}%`,
                          height: '20px',
                          zIndex: 10 + bar.track,
                        }}
                      >
                        <StepIcon className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{bar.name}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-2">
                        <div className="font-semibold">{bar.project.name}</div>
                        <div className="flex items-center gap-2">
                          <StepIcon className="h-3 w-3" />
                          <span className="text-xs">{stepLabels[bar.step]}</span>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(bar.startDate, 'dd/MM')} - {format(bar.endDate, 'dd/MM')}
                        </div>
                        {bar.project.responsibleName && (
                          <div className="text-xs">
                            <strong>Responsável:</strong> {bar.project.responsibleName}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </div>

        {/* Enhanced Legend */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-border/50">
          {Object.entries(stepLabels).map(([step, label]) => {
            const StepIcon = stepIcons[step as ProjectStep];
            const count = projectBars.bars.filter(bar => bar.step === step).length;
            
            return (
              <Badge key={step} variant="secondary" className="flex items-center gap-2 py-1">
                <div className={`w-3 h-3 rounded-sm ${stepColors[step as ProjectStep]}`} />
                <StepIcon className="h-3 w-3" />
                <span className="text-xs font-medium">{label}</span>
                {count > 0 && (
                  <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};