import React, { useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, CalendarDays } from 'lucide-react';
import { format, addWeeks, startOfWeek, endOfWeek, eachWeekOfInterval, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimelineProject {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: string;
  step: string;
  isCompleted: boolean;
}

export function ProjectCalendar() {
  const { projects } = useProjects();

  // Process projects for timeline display
  const timelineProjects = useMemo((): TimelineProject[] => {
    return projects
      .filter(project => {
        // Only show projects that have both start and end dates
        const hasStart = project.separationDate || project.startDate;
        const hasEnd = project.actualEndDate || project.expectedEndDate;
        return hasStart && hasEnd;
      })
      .map(project => {
        const startDate = new Date(project.separationDate || project.startDate);
        const endDate = new Date(project.actualEndDate || project.expectedEndDate);
        return {
          id: project.id,
          name: project.name,
          startDate,
          endDate,
          status: project.status,
          step: project.step,
          isCompleted: !!project.actualEndDate
        };
      });
  }, [projects]);

  // Calculate timeline range
  const timelineRange = useMemo(() => {
    if (timelineProjects.length === 0) {
      const now = new Date();
      return {
        start: startOfWeek(now),
        end: endOfWeek(addWeeks(now, 8))
      };
    }

    const allDates = timelineProjects.flatMap(p => [p.startDate, p.endDate]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    return {
      start: startOfWeek(minDate),
      end: endOfWeek(addWeeks(maxDate, 2))
    };
  }, [timelineProjects]);

  // Generate week columns
  const weekColumns = useMemo(() => {
    return eachWeekOfInterval({
      start: timelineRange.start,
      end: timelineRange.end
    });
  }, [timelineRange]);

  const getProjectBarStyle = (project: TimelineProject) => {
    const totalDays = differenceInDays(timelineRange.end, timelineRange.start);
    const startOffset = differenceInDays(project.startDate, timelineRange.start);
    const projectDuration = differenceInDays(project.endDate, project.startDate) + 1;
    
    const leftPercent = (startOffset / totalDays) * 100;
    const widthPercent = (projectDuration / totalDays) * 100;

    return {
      left: `${Math.max(0, leftPercent)}%`,
      width: `${Math.min(100 - Math.max(0, leftPercent), widthPercent)}%`
    };
  };

  const getProjectColor = (project: TimelineProject) => {
    switch (project.status) {
      case 'completed':
        return 'hsl(var(--success))';
      case 'active':
        return project.isCompleted ? 'hsl(var(--success))' : 'hsl(var(--primary))';
      case 'archived':
        return 'hsl(var(--muted))';
      default:
        return 'hsl(var(--primary))';
    }
  };

  return (
    <div className="bg-gradient-card rounded-lg p-6 shadow-elegant">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-semibold">Timeline de Projetos</h2>
          <p className="text-sm text-muted-foreground">
            Cronograma visual dos projetos em andamento
          </p>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Week headers */}
          <div className="flex border-b border-border mb-4">
            {weekColumns.map((week, index) => (
              <div key={index} className="flex-1 px-2 py-3 text-center border-r border-border last:border-r-0">
                <div className="text-xs font-medium text-muted-foreground">
                  {format(week, 'dd/MM', { locale: ptBR })}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {format(week, 'EEE', { locale: ptBR })}
                </div>
              </div>
            ))}
          </div>

          {/* Project timeline */}
          <div className="relative space-y-6">
            {timelineProjects.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum projeto com datas definidas encontrado</p>
              </div>
            ) : (
              timelineProjects.map((project, index) => (
                <div key={project.id} className="relative">
                  {/* Project name */}
                  <div className="mb-2">
                    <span className="text-sm font-medium">{project.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={project.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {project.status === 'active' ? 'Ativo' : 
                         project.status === 'completed' ? 'Finalizado' : 'Arquivado'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {project.step === 'pending_separation' ? 'Pendente Separação' :
                         project.step === 'separated' ? 'Separado' :
                         project.step === 'in_use' ? 'Em Uso' :
                         project.step === 'pending_verification' ? 'Pendente Verificação' :
                         project.step === 'verified' ? 'Verificado' : project.step}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Timeline bar */}
                  <div className="relative h-8 bg-muted/20 rounded-md border">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="absolute top-0 h-full rounded-md transition-colors cursor-pointer"
                            style={{
                              ...getProjectBarStyle(project),
                              backgroundColor: getProjectColor(project)
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <p className="font-medium">{project.name}</p>
                            <p className="text-xs">
                              Início: {format(project.startDate, 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                            <p className="text-xs">
                              {project.isCompleted ? 'Finalizado' : 'Previsão'}: {format(project.endDate, 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                            <p className="text-xs">
                              Duração: {differenceInDays(project.endDate, project.startDate) + 1} dias
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border">
        <h4 className="font-medium text-sm mb-3">Legenda</h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded" style={{ backgroundColor: 'hsl(var(--primary))' }} />
            <span>Projeto Ativo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded" style={{ backgroundColor: 'hsl(var(--success))' }} />
            <span>Projeto Finalizado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded" style={{ backgroundColor: 'hsl(var(--muted))' }} />
            <span>Projeto Arquivado</span>
          </div>
        </div>
      </div>
    </div>
  );
}