import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Video, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRecordingsCalendar, getEventTitle, getEventType, RecordingEvent } from '@/hooks/useRecordingsCalendar';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, addWeeks, subMonths, subWeeks, addDays,
  isSameMonth, isToday, parseISO, eachDayOfInterval, startOfDay,
  isSameDay, isSameWeek, isWithinInterval, endOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TYPE_CONFIG = {
  REC:   { label: 'REC',        className: 'bg-destructive/15 text-destructive border-0' },
  PRE:   { label: 'Pré-agenda', className: 'bg-muted text-muted-foreground border-0' },
  VT:    { label: 'VT',         className: 'bg-warning/15 text-warning border-0' },
  EDIT:  { label: 'Edição',     className: 'bg-secondary text-secondary-foreground border-0' },
  OTHER: { label: 'Evento',     className: 'bg-muted text-muted-foreground border-0' },
};

const DOT_COLORS: Record<string, string> = {
  REC: 'bg-destructive',
  PRE: 'bg-muted-foreground/50',
  VT: 'bg-warning',
  EDIT: 'bg-secondary-foreground/50',
  OTHER: 'bg-muted-foreground/30',
};

function getEventsForDay(day: Date, events: RecordingEvent[]): RecordingEvent[] {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);

  return events.filter(e => {
    if (e.allDay) {
      const eStart = startOfDay(parseISO(e.start));
      const eEnd = e.end ? startOfDay(parseISO(e.end)) : eStart;
      return dayStart >= eStart && dayStart < eEnd || isSameDay(dayStart, eStart);
    }
    const eStart = parseISO(e.start);
    const eEnd = e.end ? parseISO(e.end) : eStart;
    return eStart <= dayEnd && eEnd >= dayStart;
  });
}

function groupEventsForList(events: RecordingEvent[], today: Date) {
  const groups: { label: string; events: RecordingEvent[] }[] = [
    { label: 'Esta semana', events: [] },
    { label: 'Próxima semana', events: [] },
    { label: 'Este mês', events: [] },
    { label: 'Próximos meses', events: [] },
  ];

  const nextWeekStart = addWeeks(startOfWeek(today, { weekStartsOn: 0 }), 1);

  events.forEach(e => {
    const d = parseISO(e.start);
    if (isSameWeek(d, today, { weekStartsOn: 0 })) {
      groups[0].events.push(e);
    } else if (isSameWeek(d, nextWeekStart, { weekStartsOn: 0 })) {
      groups[1].events.push(e);
    } else if (isSameMonth(d, today)) {
      groups[2].events.push(e);
    } else {
      groups[3].events.push(e);
    }
  });

  return groups.filter(g => g.events.length > 0);
}

export function RecordingsCalendar() {
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { timeMin, timeMax } = useMemo(() => {
    let start: Date, end: Date;
    if (view === 'month') {
      start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
      end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    } else if (view === 'week') {
      start = startOfWeek(currentDate, { weekStartsOn: 0 });
      end = endOfWeek(currentDate, { weekStartsOn: 0 });
    } else {
      start = startOfDay(new Date());
      end = addDays(start, 60);
    }
    return { timeMin: start.toISOString(), timeMax: end.toISOString() };
  }, [view, currentDate]);

  const { data: events = [], isLoading } = useRecordingsCalendar(timeMin, timeMax);

  const periodLabel = useMemo(() => {
    if (view === 'month') return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    if (view === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 0 });
      const we = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(ws, "dd MMM", { locale: ptBR })} – ${format(we, "dd MMM yyyy", { locale: ptBR })}`;
    }
    return 'Próximos 60 dias';
  }, [view, currentDate]);

  const navigate = (dir: 1 | -1) => {
    if (view === 'month') setCurrentDate(d => dir === 1 ? addMonths(d, 1) : subMonths(d, 1));
    else if (view === 'week') setCurrentDate(d => dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1));
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

  const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <Card>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Video className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Agenda de Gravações</h3>
              <p className="text-xs text-muted-foreground">
                {isLoading ? 'Carregando...' : `${events.length} eventos · ${periodLabel}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Navigation */}
            {view !== 'list' && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[140px] text-center capitalize">{periodLabel}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* View switcher */}
            <div className="flex items-center bg-muted rounded-lg p-0.5">
              {(['month', 'week', 'list'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                    view === v
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : 'Todos'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Month View */}
        {view === 'month' && (
          <div>
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAY_LABELS.map(d => (
                <div key={d} className="text-[10px] text-muted-foreground uppercase tracking-wider text-center py-1.5 font-medium">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px">
              {calendarDays.map(day => {
                const dayEvents = getEventsForDay(day, events);
                const today = isToday(day);
                const sameMonth = isSameMonth(day, currentDate);
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[80px] p-1 rounded-lg transition-colors hover:bg-muted/40 cursor-pointer ${
                      today ? 'ring-1 ring-primary bg-primary/5' : ''
                    } ${!sameMonth ? 'opacity-40' : ''}`}
                  >
                    <span className={`text-xs block mb-0.5 ${today ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                      {format(day, 'd')}
                    </span>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map(e => {
                        const type = getEventType(e.summary);
                        return (
                          <div
                            key={e.id}
                            className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded truncate bg-muted/60"
                          >
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_COLORS[type]}`} />
                            <span className="truncate">{getEventTitle(e.summary)}</span>
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <span className="text-[10px] text-muted-foreground px-1.5">+{dayEvents.length - 2} mais</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week View */}
        {view === 'week' && (
          <div className="grid grid-cols-7 gap-px">
            {calendarDays.map(day => {
              const dayEvents = getEventsForDay(day, events);
              const today = isToday(day);
              return (
                <div key={day.toISOString()} className={`rounded-lg ${today ? 'bg-primary/5' : ''}`}>
                  <div className={`text-center py-2 border-b border-border ${today ? 'text-primary' : ''}`}>
                    <div className="text-[10px] uppercase text-muted-foreground">{WEEKDAY_LABELS[day.getDay()]}</div>
                    <div className={`text-lg font-semibold ${today ? 'text-primary' : ''}`}>{format(day, 'd')}</div>
                  </div>
                  <div className="p-1 space-y-1 min-h-[120px]">
                    {dayEvents.map(e => {
                      const type = getEventType(e.summary);
                      const borderColor = type === 'REC' ? 'border-l-destructive' : type === 'VT' ? 'border-l-warning' : type === 'EDIT' ? 'border-l-secondary-foreground/50' : 'border-l-muted-foreground/50';
                      return (
                        <div key={e.id} className={`rounded-lg p-2 bg-muted/40 border-l-2 ${borderColor}`}>
                          <p className="text-xs font-medium truncate">{getEventTitle(e.summary)}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {e.allDay ? 'Dia todo' : format(parseISO(e.start), 'HH:mm')}
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

        {/* List View */}
        {view === 'list' && (
          <div>
            {isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Carregando eventos...</div>
            ) : events.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Nenhum evento nos próximos 60 dias</div>
            ) : (
              groupEventsForList(events, new Date()).map(group => (
                <div key={group.label}>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-5 pt-4 pb-2 font-medium">
                    {group.label}
                  </div>
                  {group.events.map(e => {
                    const d = parseISO(e.start);
                    const type = getEventType(e.summary);
                    const config = TYPE_CONFIG[type];
                    return (
                      <div
                        key={e.id}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 cursor-pointer transition-colors border-b border-border last:border-0"
                        onClick={() => window.open('https://calendar.google.com', '_blank')}
                      >
                        <div className="w-10 text-center shrink-0">
                          <div className="text-2xl font-semibold leading-none">{format(d, 'd')}</div>
                          <div className="text-[10px] text-muted-foreground uppercase">{format(d, 'MMM', { locale: ptBR })}</div>
                        </div>
                        <div className="w-px h-8 bg-border shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{getEventTitle(e.summary)}</p>
                          <p className="text-xs text-muted-foreground">
                            {e.allDay ? 'Dia todo' : format(d, 'HH:mm')}
                            {e.location && ` · ${e.location}`}
                          </p>
                        </div>
                        <Badge variant="outline" className={`shrink-0 text-[10px] ${config.className}`}>
                          {config.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-border flex justify-end">
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            Abrir no Google Calendar
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
