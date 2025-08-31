import React, { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarDays, PlayCircle, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProjectEvent {
  date: string;
  projects: Array<{
    id: string;
    name: string;
    type: 'start' | 'expected_end' | 'actual_end';
    status: string;
  }>;
}

export function ProjectCalendar() {
  const { projects } = useProjects();
  const [selectedDate, setSelectedDate] = useState<Date>();

  // Process project dates into events
  const projectEvents = useMemo(() => {
    const eventsMap = new Map<string, ProjectEvent>();

    projects.forEach(project => {
      // Add start date
      if (project.startDate) {
        const dateKey = project.startDate;
        if (!eventsMap.has(dateKey)) {
          eventsMap.set(dateKey, { date: dateKey, projects: [] });
        }
        eventsMap.get(dateKey)!.projects.push({
          id: project.id,
          name: project.name,
          type: 'start',
          status: project.status
        });
      }

      // Add expected end date
      if (project.expectedEndDate) {
        const dateKey = project.expectedEndDate;
        if (!eventsMap.has(dateKey)) {
          eventsMap.set(dateKey, { date: dateKey, projects: [] });
        }
        eventsMap.get(dateKey)!.projects.push({
          id: project.id,
          name: project.name,
          type: 'expected_end',
          status: project.status
        });
      }

      // Add actual end date
      if (project.actualEndDate) {
        const dateKey = project.actualEndDate;
        if (!eventsMap.has(dateKey)) {
          eventsMap.set(dateKey, { date: dateKey, projects: [] });
        }
        eventsMap.get(dateKey)!.projects.push({
          id: project.id,
          name: project.name,
          type: 'actual_end',
          status: project.status
        });
      }
    });

    return Array.from(eventsMap.values());
  }, [projects]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return null;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return projectEvents.find(event => event.date === dateKey);
  }, [selectedDate, projectEvents]);

  // Create array of dates that have events
  const eventDates = useMemo(() => {
    return projectEvents.map(event => new Date(event.date));
  }, [projectEvents]);

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'start':
        return <PlayCircle className="h-4 w-4" />;
      case 'expected_end':
        return <Clock className="h-4 w-4" />;
      case 'actual_end':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <CalendarDays className="h-4 w-4" />;
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'start':
        return 'Início';
      case 'expected_end':
        return 'Fim Esperado';
      case 'actual_end':
        return 'Fim Real';
      default:
        return type;
    }
  };

  const getEventTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'start':
        return 'default';
      case 'expected_end':
        return 'secondary';
      case 'actual_end':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <div className="bg-gradient-card rounded-lg p-6 shadow-elegant">
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-semibold">Calendário de Projetos</h2>
          <p className="text-sm text-muted-foreground">
            Datas de início e término dos projetos ativos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TooltipProvider>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border shadow-sm"
              modifiers={{
                hasEvent: eventDates
              }}
              modifiersStyles={{
                hasEvent: {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  fontWeight: 'bold'
                }
              }}
              components={{
                Day: ({ date, ...props }) => {
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const events = projectEvents.find(event => event.date === dateKey);
                  
                  if (events) {
                    return (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            {...props}
                            className="relative h-9 w-9 p-0 font-normal hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[today]:bg-accent data-[today]:text-accent-foreground rounded-md bg-primary text-primary-foreground font-bold"
                          >
                            {format(date, 'd')}
                            <div className="absolute -top-1 -right-1 h-2 w-2 bg-accent rounded-full" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            {events.projects.slice(0, 3).map((project, idx) => (
                              <div key={idx} className="text-xs">
                                {getEventTypeLabel(project.type)}: {project.name}
                              </div>
                            ))}
                            {events.projects.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{events.projects.length - 3} mais...
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }
                  
                  return <button {...props}>{format(date, 'd')}</button>;
                }
              }}
            />
          </TooltipProvider>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-3">
              {selectedDate ? (
                <>Eventos em {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}</>
              ) : (
                'Selecione uma data'
              )}
            </h3>
            
            {selectedDateEvents ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedDateEvents.projects.map((project, idx) => (
                  <Card key={idx} className="p-3">
                    <div className="flex items-start gap-3">
                      {getEventTypeIcon(project.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {project.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getEventTypeBadgeVariant(project.type)} className="text-xs">
                            {getEventTypeLabel(project.type)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {project.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : selectedDate ? (
              <p className="text-sm text-muted-foreground">
                Nenhum evento nesta data
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Clique em uma data para ver os eventos
              </p>
            )}
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-sm mb-2">Legenda</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <PlayCircle className="h-3 w-3" />
                <span>Início do projeto</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>Fim esperado</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                <span>Fim real</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}