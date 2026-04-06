import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Video, ExternalLink, X, Calendar, MapPin, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRecordingsCalendar, getEventTitle, getEventType, RecordingEvent } from '@/hooks/useRecordingsCalendar';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, addWeeks, subMonths, subWeeks, addDays,
  isSameMonth, isToday, parseISO, eachDayOfInterval, startOfDay,
  isSameDay, isSameWeek, endOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TYPE_CONFIG = {
  REC:   { label: 'REC',        className: 'bg-destructive/15 text-destructive border-0' },
  PRE:   { label: 'Pré-agenda', className: 'bg-muted text-muted-foreground border-0' },
  VT:    { label: 'VT',         className: 'bg-warning/15 text-warning border-0' },
  EDIT:  { label: 'Edição',     className: 'bg-secondary text-secondary-foreground border-0' },
  OTHER: { label: 'Evento',     className: 'bg-muted text-muted-foreground border-0' },
};

const PILL_COLORS: Record<string, string> = {
  REC: 'bg-destructive/15 text-destructive font-medium',
  PRE: 'bg-muted text-muted-foreground',
  VT: 'bg-warning/15 text-warning font-medium',
  EDIT: 'bg-secondary text-secondary-foreground',
  OTHER: 'bg-muted text-muted-foreground',
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

function EventDetailPopover({ event, onClose }: { event: RecordingEvent; onClose: () => void }) {
  const type = getEventType(event.summary);
  const title = getEventTitle(event.summary);
  const config = TYPE_CONFIG[type];

  const startDate = event.allDay
    ? format(parseISO(event.start), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : format(parseISO(event.start), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  const endDate = event.end
    ? (event.allDay
      ? format(parseISO(event.end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
      : format(parseISO(event.end), "HH:mm", { locale: ptBR }))
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-background border border-border rounded-2xl shadow-2xl w-[360px] max-w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className={`h-1 w-full ${type === 'REC' ? 'bg-destructive' : type === 'VT' ? 'bg-warning' : 'bg-muted-foreground/30'}`} />

        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mb-2 ${config.className}`}>
                {config.label}
              </span>
              <h3 className="text-base font-semibold leading-tight">{title}</h3>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm">{startDate}</p>
                {event.allDay ? (
                  <p className="text-xs text-muted-foreground">Dia todo</p>
                ) : endDate ? (
                  <p className="text-xs text-muted-foreground">até {endDate}</p>
                ) : null}
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm">{event.location}</p>
              </div>
            )}

            {event.description && (
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground line-clamp-4">{event.description}</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Abrir no Google Calendar
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function RecordingsCalendar() {
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<RecordingEvent | null>(null);
  const [animKey, setAnimKey] = useState(0);

  const { timeMin, timeMax } = useMemo(() => {
    let start: Date, end: Date;
    if (view === 'month') {
      start = startOfMonth(currentDate);
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
            <div className="p-2 rounded-lg bg-destructive/10">
              <Video className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Agenda de Gravações</h3>
              <p className="text-xs text-muted-foreground">
                {isLoading ? 'Carregando...' : `${events.length} eventos · ${periodLabel}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

            <div className="flex items-center bg-muted rounded-lg p-0.5">
              {(['month', 'week', 'list'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => { setView(v); setAnimKey(k => k + 1); }}
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

        <div key={animKey} className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
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
            <div className="grid grid-cols-7">
              {calendarDays.map(day => {
                const sameMonth = isSameMonth(day, currentDate);
                const dayEvents = sameMonth ? getEventsForDay(day, events) : [];
                const today = isToday(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[80px] p-1.5 border border-border/20 transition-colors hover:bg-muted/30 cursor-pointer ${!sameMonth ? 'opacity-30 bg-muted/20' : ''}`}
                  >
                    {today ? (
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium mb-0.5">{format(day, 'd')}</span>
                    ) : (
                      <span className="text-xs block mb-0.5 text-muted-foreground">{format(day, 'd')}</span>
                    )}
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map(e => {
                        const type = getEventType(e.summary);
                        return (
                          <div
                            key={e.id}
                            onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); }}
                            className={`text-[10px] px-1.5 py-0.5 rounded truncate w-full cursor-pointer ${PILL_COLORS[type]}`}
                          >
                            {getEventTitle(e.summary)}
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
                        <div
                          key={e.id}
                          onClick={() => setSelectedEvent(e)}
                          className={`rounded-lg p-2 bg-muted/40 border-l-2 ${borderColor} cursor-pointer hover:bg-muted/60 transition-colors`}
                        >
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
                        onClick={() => setSelectedEvent(e)}
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

        </div>

        {/* Event Detail Popover */}
        {selectedEvent && <EventDetailPopover event={selectedEvent} onClose={() => setSelectedEvent(null)} />}

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
