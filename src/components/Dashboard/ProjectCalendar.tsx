import React, { useState, useMemo, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameMonth, isToday, parseISO, differenceInDays, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, Clock, AlertTriangle, Package, Eye, EyeOff, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
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
  // Enhanced visual properties
  isOverdue: boolean;
  isMultiWeek: boolean;
  totalDuration: number;
  progress: number;
  hasEquipment: boolean;
  extendsBeforeMonth: boolean;
  extendsAfterMonth: boolean;
}

export const ProjectCalendar: React.FC = () => {
  const { projects, loading } = useProjects();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hiddenSteps, setHiddenSteps] = useState<Set<ProjectStep>>(new Set());
  const [showOnlyUserProjects, setShowOnlyUserProjects] = useState(false);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  // Toggle step visibility
  const toggleStepVisibility = useCallback((step: ProjectStep) => {
    setHiddenSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(step)) {
        newSet.delete(step);
      } else {
        newSet.add(step);
      }
      return newSet;
    });
  }, []);

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

  // Process projects into bars with enhanced logic
  const projectBars = useMemo(() => {
    if (!projects || !projects.length) return { bars: [], maxTracks: 0 };

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

          // Find available track for this week with improved spacing
          if (!weekTracks[weekIndex]) {
            weekTracks[weekIndex] = [];
          }

          // Find track that doesn't conflict with better spacing
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

          const today = new Date();
          const totalDuration = differenceInDays(endDate, startDate) + 1;
          const daysSinceStart = differenceInDays(today, startDate);
          const progress = Math.max(0, Math.min(100, (daysSinceStart / totalDuration) * 100));
          
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
            project,
            // Enhanced visual properties
            isOverdue: project.actualEndDate ? false : isBefore(parseISO(project.expectedEndDate), today),
            isMultiWeek: differenceInDays(endDate, startDate) > 6,
            totalDuration,
            progress,
            hasEquipment: project.equipmentCount > 0,
            extendsBeforeMonth: startDate < monthStart,
            extendsAfterMonth: endDate > monthEnd
          };

          bars.push(projectBar);
          weekTracks[weekIndex].push(projectBar);
          maxTracks = Math.max(maxTracks, track + 1);
        }
      });
    });

    return { bars, maxTracks };
  }, [projects, currentMonth, calendarStructure.weeks]);

  // Filter bars based on visibility settings
  const visibleBars = useMemo(() => {
    return projectBars.bars.filter(bar => !hiddenSteps.has(bar.step));
  }, [projectBars.bars, hiddenSteps]);

  if (loading || !projects) {
    return (
      <Card className="bg-gradient-card shadow-elegant animate-fade-in">
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
    <Card className="bg-gradient-card shadow-elegant transition-all duration-300 animate-fade-in">
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
              aria-label="Mês anterior"
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
              aria-label="Próximo mês"
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
            style={{ minHeight: `${320 + (projectBars.maxTracks * 32)}px` }}
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

            {/* Enhanced Project Bars Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {visibleBars.map((bar) => {
                const StepIcon = stepIcons[bar.step];
                
                return (
                  <Tooltip key={bar.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={`
                          absolute pointer-events-auto cursor-pointer rounded-lg px-3 py-2
                          text-xs font-medium transition-all duration-200 
                          hover:scale-105 hover:shadow-lg hover:z-30 hover:brightness-110
                          flex items-center gap-2 border-l-2 border-l-primary/30
                          ${bar.color} ${bar.isOverdue ? 'ring-1 ring-destructive/50' : ''}
                          ${bar.extendsBeforeMonth || bar.extendsAfterMonth ? 'bg-gradient-to-r' : ''}
                          animate-slide-up
                        `}
                        style={{
                          top: `${(bar.week * 80) + 26 + (bar.track * 32)}px`,
                          left: `${(bar.startDay / 7) * 100}%`,
                          width: `${(bar.span / 7) * 100}%`,
                          height: '26px',
                          zIndex: 10 + bar.track,
                          animationDelay: `${bar.track * 100}ms`,
                        }}
                        aria-label={`Projeto ${bar.name} - ${stepLabels[bar.step]}`}
                        role="button"
                        tabIndex={0}
                      >
                        <StepIcon className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate font-medium">{bar.name}</span>
                        {bar.isOverdue && <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />}
                        {bar.hasEquipment && <Package className="h-3 w-3 flex-shrink-0 opacity-70" />}
                        {bar.extendsBeforeMonth && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-current to-transparent opacity-60" />
                        )}
                        {bar.extendsAfterMonth && (
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-current to-transparent opacity-60" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm p-4" side="top">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-base">{bar.project.name}</div>
                          {bar.isOverdue && (
                            <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                              <AlertTriangle className="h-3 w-3" />
                              Atrasado
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <StepIcon className="h-4 w-4" />
                          <span className="text-sm font-medium">{stepLabels[bar.step]}</span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {format(parseISO(bar.project.startDate), 'dd/MM/yyyy')} - {' '}
                              {format(parseISO(bar.project.actualEndDate || bar.project.expectedEndDate), 'dd/MM/yyyy')}
                            </span>
                          </div>
                          
                          {bar.progress > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span>Progresso</span>
                                <span className="font-medium">{Math.round(bar.progress)}%</span>
                              </div>
                              <Progress value={bar.progress} className="h-2" />
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {bar.totalDuration > 1 && (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {bar.totalDuration} dias
                              </div>
                            )}
                            {bar.hasEquipment && (
                              <div className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {bar.project.equipmentCount} itens
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {bar.project.responsibleName && (
                          <div className="flex items-center gap-2 text-sm border-t border-border/50 pt-2">
                            <Users className="h-3 w-3" />
                            <span><strong>Responsável:</strong> {bar.project.responsibleName}</span>
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

        {/* Enhanced Interactive Legend */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Status dos Projetos</h4>
            <div className="text-xs text-muted-foreground">
              {visibleBars.length} de {projectBars.bars.length} projetos visíveis
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {Object.entries(stepLabels).map(([step, label]) => {
              const StepIcon = stepIcons[step as ProjectStep];
              const allCount = projectBars.bars.filter(bar => bar.step === step).length;
              const visibleCount = visibleBars.filter(bar => bar.step === step).length;
              const isHidden = hiddenSteps.has(step as ProjectStep);
              
              return (
                <Button
                  key={step}
                  variant={isHidden ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => toggleStepVisibility(step as ProjectStep)}
                  className={`
                    flex items-center gap-2 py-2 px-3 transition-all duration-200
                    hover:scale-105 ${isHidden ? 'opacity-50' : ''}
                  `}
                  aria-pressed={!isHidden}
                  aria-label={`${isHidden ? 'Mostrar' : 'Ocultar'} projetos ${label}`}
                >
                  {isHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  <div className={`w-3 h-3 rounded-sm bg-${step.replace('_', '-')}`} />
                  <StepIcon className="h-3 w-3" />
                  <span className="text-xs font-medium">{label}</span>
                  {allCount > 0 && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5 min-w-[20px] justify-center">
                      {isHidden ? allCount : visibleCount}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
          
          {/* Project density indicator */}
          {projectBars.maxTracks > 3 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 p-2 bg-muted/20 rounded-lg">
              <AlertTriangle className="h-3 w-3 text-warning" />
              <span>
                Mês com alta densidade de projetos ({projectBars.maxTracks} trilhas simultâneas)
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};