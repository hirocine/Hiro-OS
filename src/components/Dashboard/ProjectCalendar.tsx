import React, { useState, useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isToday, startOfWeek, endOfWeek, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProjectBar {
  id: string;
  name: string;
  status: string;
  step: string;
  startDate: Date;
  endDate: Date;
  gridColumnStart: number;
  gridColumnSpan: number;
  color: string;
  track: number; // For stacking overlapping projects
  weekRow: number; // Which week row this bar is in
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

  // Process projects into continuous bars
  const projectBars = useMemo(() => {
    const monthStart = startOfWeek(startOfMonth(currentMonth));
    
    // Get project color based on status
    const getProjectColor = (project: any) => {
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

    const bars: ProjectBar[] = [];
    
    projects.forEach(project => {
      const startDateStr = project.separationDate || project.startDate;
      const endDateStr = project.actualEndDate || project.expectedEndDate;
      
      if (!startDateStr || !endDateStr) return;

      const projectStart = new Date(startDateStr);
      const projectEnd = new Date(endDateStr);
      
      // Only show projects that intersect with current month view
      const monthEnd = endOfMonth(currentMonth);
      if (projectEnd < startOfMonth(currentMonth) || projectStart > monthEnd) return;

      // Clamp dates to calendar view
      const viewStart = Math.max(projectStart.getTime(), monthStart.getTime());
      const viewEnd = Math.min(projectEnd.getTime(), calendarDays[calendarDays.length - 1].getTime());
      
      const clampedStart = new Date(viewStart);
      const clampedEnd = new Date(viewEnd);
      
      // Calculate which calendar day this starts and ends
      const startIndex = calendarDays.findIndex(day => 
        day.getTime() >= clampedStart.getTime() && day.toDateString() === clampedStart.toDateString()
      );
      const endIndex = calendarDays.findIndex(day => 
        day.toDateString() === clampedEnd.toDateString()
      );
      
      if (startIndex === -1 || endIndex === -1) return;

      // Create bars for each week row the project spans
      let currentIndex = startIndex;
      let barId = 0;
      
      while (currentIndex <= endIndex) {
        const weekStart = Math.floor(currentIndex / 7) * 7;
        const weekEnd = Math.min(weekStart + 6, calendarDays.length - 1);
        const barEndIndex = Math.min(endIndex, weekEnd);
        
        if (currentIndex <= barEndIndex) {
          const gridColumnStart = (currentIndex % 7) + 1;
          const gridColumnSpan = (barEndIndex % 7) - (currentIndex % 7) + 1;
          
          bars.push({
            id: `${project.id}-${barId}`,
            name: project.name,
            status: project.status,
            step: project.step,
            startDate: projectStart,
            endDate: projectEnd,
            gridColumnStart,
            gridColumnSpan,
            color: getProjectColor(project),
            track: 0, // Will be calculated for stacking
            weekRow: Math.floor(currentIndex / 7)
          });
          
          barId++;
        }
        
        currentIndex = weekEnd + 1;
      }
    });

    // Calculate tracks to avoid overlapping within each week
    const weekTracks: { [weekRow: number]: ProjectBar[][] } = {};
    
    bars.forEach(bar => {
      if (!weekTracks[bar.weekRow]) {
        weekTracks[bar.weekRow] = [];
      }
    });

    // Sort bars by start position within each week
    bars.sort((a, b) => {
      if (a.weekRow !== b.weekRow) return a.weekRow - b.weekRow;
      return a.gridColumnStart - b.gridColumnStart;
    });
    
    bars.forEach(bar => {
      let assignedTrack = -1;
      const weekTrackArray = weekTracks[bar.weekRow];
      
      // Find a track where this bar doesn't overlap
      for (let i = 0; i < weekTrackArray.length; i++) {
        const trackBars = weekTrackArray[i];
        const hasOverlap = trackBars.some(existingBar => {
          const barEnd = bar.gridColumnStart + bar.gridColumnSpan - 1;
          const existingEnd = existingBar.gridColumnStart + existingBar.gridColumnSpan - 1;
          
          return !(barEnd < existingBar.gridColumnStart || bar.gridColumnStart > existingEnd);
        });
        
        if (!hasOverlap) {
          assignedTrack = i;
          break;
        }
      }
      
      // If no track found, create a new one
      if (assignedTrack === -1) {
        assignedTrack = weekTrackArray.length;
        weekTrackArray.push([]);
      }
      
      bar.track = assignedTrack;
      weekTrackArray[assignedTrack].push(bar);
    });

    const maxTracks = Math.max(...Object.values(weekTracks).map(tracks => tracks.length), 0);
    
    return { bars, maxTracks };
  }, [projects, currentMonth, calendarDays]);

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  return (
    <div className="bg-gradient-card rounded-xl p-6 shadow-elegant">
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
      <div className="relative">
        {/* Grid container */}
        <div 
          className="grid grid-cols-7 gap-2 rounded-lg overflow-hidden bg-card shadow-sm"
          style={{ 
            minHeight: `${Math.max(400, 60 + (projectBars.maxTracks * 35))}px` 
          }}
        >
          {/* Week day headers */}
          {weekDays.map((day, index) => (
            <div 
              key={day} 
              className="p-3 text-center text-sm font-medium text-muted-foreground bg-muted/50 border-b border-border"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, dayIndex) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);

            return (
              <div 
                key={dayKey}
                className={`min-h-[60px] p-3 rounded-lg transition-colors ${
                  isCurrentMonth ? 'bg-background hover:bg-muted/20' : 'bg-muted/10'
                } ${isCurrentDay ? 'ring-2 ring-primary bg-primary/5' : ''}`}
              >
                {/* Day number */}
                <div className={`text-sm font-medium ${
                  isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                } ${isCurrentDay ? 'text-primary font-bold' : ''}`}>
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Project bars overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ top: '52px' }}>
          {/* Create week rows */}
          {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => (
            <div 
              key={weekIndex} 
              className="relative" 
              style={{ 
                height: `${60 + (projectBars.maxTracks * 32)}px`,
                top: `${weekIndex * 68}px` // Adjusted for gap-2 spacing
              }}
            >
              {/* Week bars */}
              {projectBars.bars
                .filter(bar => bar.weekRow === weekIndex)
                .map((bar) => (
                  <TooltipProvider key={bar.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute pointer-events-auto cursor-pointer rounded-lg px-2 py-1 transition-all hover:scale-105 hover:shadow-md flex items-center justify-center text-white font-medium text-xs truncate border border-white/20"
                          style={{
                            backgroundColor: bar.color,
                            left: `${((bar.gridColumnStart - 1) / 7) * 100}%`,
                            width: `${(bar.gridColumnSpan / 7) * 100}%`,
                            top: `${bar.track * 32 + 25}px`,
                            height: '28px',
                            zIndex: 10 + bar.track
                          }}
                        >
                          <span className="truncate w-full text-center font-medium">
                            {bar.name}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p className="font-medium">{bar.name}</p>
                          <div className="flex gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {format(bar.startDate, 'dd/MM')}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {format(bar.endDate, 'dd/MM')}
                            </Badge>
                          </div>
                          <p className="text-xs">
                            Status: {bar.status === 'active' ? 'Ativo' : 
                                    bar.status === 'completed' ? 'Finalizado' : 'Arquivado'}
                          </p>
                          <p className="text-xs">
                            Etapa: {bar.step}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
            </div>
          ))}
        </div>
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