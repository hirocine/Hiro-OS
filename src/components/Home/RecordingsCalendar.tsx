import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Video, ExternalLink, X, Calendar, MapPin, FileText } from 'lucide-react';
import { useRecordingsCalendar, getEventTitle, getEventType, RecordingEvent } from '@/hooks/useRecordingsCalendar';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, addWeeks, subMonths, subWeeks, addDays,
  isSameMonth, isToday, parseISO, eachDayOfInterval, startOfDay,
  isSameDay, isSameWeek, endOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

type EventType = 'REC' | 'PRE' | 'VT' | 'EDIT' | 'OTHER';

interface TypeConfig {
  label: string;
  color: string; // hsl(var(--ds-...))
  bg: string;    // hsl(var(--ds-...) / 0.10) or transparent
}

const TYPE_CONFIG: Record<EventType, TypeConfig> = {
  REC:   { label: 'REC',        color: 'hsl(var(--ds-danger))',  bg: 'hsl(var(--ds-danger) / 0.12)' },
  PRE:   { label: 'Pré-agenda', color: 'hsl(var(--ds-fg-3))',    bg: 'hsl(var(--ds-line-2) / 0.4)' },
  VT:    { label: 'VT',         color: 'hsl(var(--ds-warn))',    bg: 'hsl(var(--ds-warn) / 0.12)' },
  EDIT:  { label: 'Edição',     color: 'hsl(var(--ds-fg-2))',    bg: 'hsl(var(--ds-surface-2))' },
  OTHER: { label: 'Evento',     color: 'hsl(var(--ds-fg-3))',    bg: 'hsl(var(--ds-line-2) / 0.4)' },
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
  const type = getEventType(event.summary) as EventType;
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

  const accentBar =
    type === 'REC' ? 'hsl(var(--ds-danger))' :
    type === 'VT' ? 'hsl(var(--ds-warn))' :
    'hsl(var(--ds-fg-4))';

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(4px)',
        }}
      />
      <div
        style={{
          position: 'relative',
          background: 'hsl(var(--ds-surface))',
          border: '1px solid hsl(var(--ds-line-1))',
          width: 360,
          maxWidth: '100%',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ height: 2, width: '100%', background: accentBar }} />

        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span
                className="pill"
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  marginBottom: 8,
                  color: config.color,
                  borderColor: `${config.color.replace(')', ' / 0.3)')}`,
                  background: config.bg,
                  display: 'inline-flex',
                }}
              >
                {config.label}
              </span>
              <h3
                style={{
                  fontFamily: '"HN Display", sans-serif',
                  fontSize: 16,
                  fontWeight: 600,
                  lineHeight: 1.3,
                  color: 'hsl(var(--ds-fg-1))',
                  marginTop: 8,
                }}
              >
                {title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn"
              style={{ width: 28, height: 28, padding: 0, justifyContent: 'center' }}
              aria-label="Fechar"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <Calendar size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))', flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-1))', fontVariantNumeric: 'tabular-nums' }}>{startDate}</p>
                {event.allDay ? (
                  <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}>Dia todo</p>
                ) : endDate ? (
                  <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>até {endDate}</p>
                ) : null}
              </div>
            </div>

            {event.location && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <MapPin size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))', flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-1))' }}>{event.location}</p>
              </div>
            )}

            {event.description && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <FileText size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))', flexShrink: 0, marginTop: 2 }} />
                <p
                  style={{
                    fontSize: 13,
                    color: 'hsl(var(--ds-fg-3))',
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {event.description}
                </p>
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: '1px solid hsl(var(--ds-line-1))',
            }}
          >
            <a
              href={event.htmlLink || 'https://calendar.google.com'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: 'hsl(var(--ds-fg-3))',
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={12} strokeWidth={1.5} />
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

  const navigatePeriod = (dir: 1 | -1) => {
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
    <div
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid hsl(var(--ds-line-1))',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Video size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span
              style={{
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 500,
                color: 'hsl(var(--ds-fg-2))',
              }}
            >
              Agenda de Gravações
            </span>
            <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))', fontVariantNumeric: 'tabular-nums' }}>
              {isLoading ? 'Carregando...' : `${events.length} eventos · ${periodLabel}`}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {view !== 'list' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                className="btn"
                style={{ width: 28, height: 28, padding: 0, justifyContent: 'center' }}
                onClick={() => navigatePeriod(-1)}
                aria-label="Período anterior"
              >
                <ChevronLeft size={14} strokeWidth={1.5} />
              </button>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  minWidth: 140,
                  textAlign: 'center',
                  textTransform: 'capitalize',
                  color: 'hsl(var(--ds-fg-1))',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {periodLabel}
              </span>
              <button
                type="button"
                className="btn"
                style={{ width: 28, height: 28, padding: 0, justifyContent: 'center' }}
                onClick={() => navigatePeriod(1)}
                aria-label="Próximo período"
              >
                <ChevronRight size={14} strokeWidth={1.5} />
              </button>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid hsl(var(--ds-line-1))',
            }}
          >
            {(['month', 'week', 'list'] as const).map((v, idx) => (
              <button
                key={v}
                type="button"
                onClick={() => { setView(v); setAnimKey(k => k + 1); }}
                style={{
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  padding: '6px 12px',
                  background: view === v ? 'hsl(var(--ds-surface-2))' : 'transparent',
                  color: view === v ? 'hsl(var(--ds-fg-1))' : 'hsl(var(--ds-fg-3))',
                  border: 'none',
                  borderLeft: idx > 0 ? '1px solid hsl(var(--ds-line-1))' : 'none',
                  cursor: 'pointer',
                  fontWeight: view === v ? 500 : 400,
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
              >
                {v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : 'Todos'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: 18 }}>
        <div key={animKey} className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
          {/* Month View */}
          {view === 'month' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
                {WEEKDAY_LABELS.map(d => (
                  <div
                    key={d}
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      fontWeight: 500,
                      color: 'hsl(var(--ds-fg-3))',
                      textAlign: 'center',
                      padding: '6px 0',
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  border: '1px solid hsl(var(--ds-line-1))',
                }}
              >
                {calendarDays.map((day, idx) => {
                  const sameMonth = isSameMonth(day, currentDate);
                  const dayEvents = sameMonth ? getEventsForDay(day, events) : [];
                  const today = isToday(day);
                  const colIdx = idx % 7;
                  const rowIdx = Math.floor(idx / 7);
                  return (
                    <div
                      key={day.toISOString()}
                      style={{
                        minHeight: 80,
                        padding: 6,
                        borderRight: colIdx < 6 ? '1px solid hsl(var(--ds-line-1))' : 'none',
                        borderTop: rowIdx > 0 ? '1px solid hsl(var(--ds-line-1))' : 'none',
                        background: !sameMonth ? 'hsl(var(--ds-line-2) / 0.15)' : 'transparent',
                        opacity: !sameMonth ? 0.5 : 1,
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {today ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 22,
                            height: 22,
                            background: 'hsl(var(--ds-fg-1))',
                            color: 'hsl(var(--ds-surface))',
                            fontSize: 11,
                            fontWeight: 600,
                            marginBottom: 2,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {format(day, 'd')}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            display: 'block',
                            marginBottom: 2,
                            color: 'hsl(var(--ds-fg-3))',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {format(day, 'd')}
                        </span>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {dayEvents.slice(0, 2).map(e => {
                          const type = getEventType(e.summary) as EventType;
                          const cfg = TYPE_CONFIG[type];
                          return (
                            <div
                              key={e.id}
                              onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); }}
                              style={{
                                fontSize: 10,
                                padding: '2px 6px',
                                background: cfg.bg,
                                color: cfg.color,
                                fontWeight: type === 'REC' || type === 'VT' ? 500 : 400,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                width: '100%',
                                cursor: 'pointer',
                              }}
                            >
                              {getEventTitle(e.summary)}
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <span style={{ fontSize: 10, color: 'hsl(var(--ds-fg-3))', padding: '0 6px', fontVariantNumeric: 'tabular-nums' }}>
                            +{dayEvents.length - 2} mais
                          </span>
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
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                border: '1px solid hsl(var(--ds-line-1))',
              }}
            >
              {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDay(day, events);
                const today = isToday(day);
                return (
                  <div
                    key={day.toISOString()}
                    style={{
                      borderRight: idx < 6 ? '1px solid hsl(var(--ds-line-1))' : 'none',
                      background: today ? 'hsl(var(--ds-accent) / 0.04)' : 'transparent',
                    }}
                  >
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '8px 0',
                        borderBottom: '1px solid hsl(var(--ds-line-1))',
                        color: today ? 'hsl(var(--ds-accent))' : 'inherit',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: today ? 'hsl(var(--ds-accent))' : 'hsl(var(--ds-fg-3))',
                          fontWeight: 500,
                        }}
                      >
                        {WEEKDAY_LABELS[day.getDay()]}
                      </div>
                      <div
                        style={{
                          fontFamily: '"HN Display", sans-serif',
                          fontSize: 18,
                          fontWeight: 600,
                          color: today ? 'hsl(var(--ds-accent))' : 'hsl(var(--ds-fg-1))',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {format(day, 'd')}
                      </div>
                    </div>
                    <div style={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 4, minHeight: 120 }}>
                      {dayEvents.map(e => {
                        const type = getEventType(e.summary) as EventType;
                        const borderColor =
                          type === 'REC' ? 'hsl(var(--ds-danger))' :
                          type === 'VT' ? 'hsl(var(--ds-warn))' :
                          type === 'EDIT' ? 'hsl(var(--ds-fg-3))' :
                          'hsl(var(--ds-fg-4))';
                        return (
                          <div
                            key={e.id}
                            onClick={() => setSelectedEvent(e)}
                            style={{
                              padding: 8,
                              background: 'hsl(var(--ds-surface-2))',
                              borderLeft: `2px solid ${borderColor}`,
                              cursor: 'pointer',
                              transition: 'background 0.15s ease',
                            }}
                          >
                            <p
                              style={{
                                fontSize: 12,
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: 'hsl(var(--ds-fg-1))',
                              }}
                            >
                              {getEventTitle(e.summary)}
                            </p>
                            <p style={{ fontSize: 10, color: 'hsl(var(--ds-fg-3))', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
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
                <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                  Carregando eventos...
                </div>
              ) : events.length === 0 ? (
                <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                  Nenhum evento nos próximos 60 dias
                </div>
              ) : (
                groupEventsForList(events, new Date()).map(group => (
                  <div key={group.label}>
                    <div
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'hsl(var(--ds-fg-3))',
                        padding: '16px 4px 8px',
                        fontWeight: 500,
                      }}
                    >
                      {group.label}
                    </div>
                    {group.events.map((e, eIdx, arr) => {
                      const d = parseISO(e.start);
                      const type = getEventType(e.summary) as EventType;
                      const cfg = TYPE_CONFIG[type];
                      const isLast = eIdx === arr.length - 1;
                      return (
                        <div
                          key={e.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 4px',
                            cursor: 'pointer',
                            borderBottom: isLast ? 'none' : '1px solid hsl(var(--ds-line-1))',
                            transition: 'background 0.15s ease',
                          }}
                          onClick={() => setSelectedEvent(e)}
                        >
                          <div style={{ width: 40, textAlign: 'center', flexShrink: 0 }}>
                            <div
                              style={{
                                fontFamily: '"HN Display", sans-serif',
                                fontSize: 22,
                                fontWeight: 600,
                                lineHeight: 1,
                                color: 'hsl(var(--ds-fg-1))',
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {format(d, 'd')}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: 'hsl(var(--ds-fg-3))',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                marginTop: 2,
                              }}
                            >
                              {format(d, 'MMM', { locale: ptBR })}
                            </div>
                          </div>
                          <div style={{ width: 1, height: 32, background: 'hsl(var(--ds-line-1))', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                color: 'hsl(var(--ds-fg-1))',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {getEventTitle(e.summary)}
                            </p>
                            <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                              {e.allDay ? 'Dia todo' : format(d, 'HH:mm')}
                              {e.location && ` · ${e.location}`}
                            </p>
                          </div>
                          <span
                            className="pill"
                            style={{
                              fontSize: 10,
                              flexShrink: 0,
                              color: cfg.color,
                              borderColor: cfg.color.replace(')', ' / 0.3)'),
                              background: cfg.bg,
                            }}
                          >
                            {cfg.label}
                          </span>
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
        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid hsl(var(--ds-line-1))',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 12,
              color: 'hsl(var(--ds-fg-3))',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              textDecoration: 'none',
            }}
          >
            Abrir no Google Calendar
            <ExternalLink size={12} strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </div>
  );
}
