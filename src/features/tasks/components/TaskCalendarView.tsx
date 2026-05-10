import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PriorityBadge } from './PriorityBadge';
import { Task } from '../types';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, addWeeks, subMonths, subWeeks,
  isSameMonth, isToday, eachDayOfInterval, startOfDay,
  isSameWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskCalendarViewProps {
  tasks: Task[];
  isLoading?: boolean;
}

const priorityBg: Record<string, { bg: string; fg: string }> = {
  urgente: { bg: 'hsl(var(--ds-danger) / 0.15)', fg: 'hsl(var(--ds-danger))' },
  alta:    { bg: 'hsl(var(--ds-warning) / 0.15)', fg: 'hsl(var(--ds-warning))' },
  media:   { bg: 'hsl(var(--ds-warning) / 0.1)', fg: 'hsl(var(--ds-warning))' },
  baixa:   { bg: 'hsl(var(--ds-info) / 0.15)', fg: 'hsl(var(--ds-info))' },
  standby: { bg: 'hsl(var(--ds-line-2))', fg: 'hsl(var(--ds-fg-3))' },
};

const priorityBorder: Record<string, string> = {
  urgente: 'hsl(var(--ds-danger))',
  alta:    'hsl(var(--ds-warning))',
  media:   'hsl(var(--ds-warning))',
  baixa:   'hsl(var(--ds-info))',
  standby: 'hsl(var(--ds-fg-4))',
};

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export function TaskCalendarView({ tasks, isLoading }: TaskCalendarViewProps) {
  const navigate = useNavigate();
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [animKey, setAnimKey] = useState(0);

  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'concluida' && t.status !== 'arquivada' && t.due_date),
    [tasks]
  );

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    activeTasks.forEach((task) => {
      if (task.due_date) {
        const dateKey = task.due_date.split('T')[0];
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, task]);
      }
    });
    return map;
  }, [activeTasks]);

  const getTasksForDay = (day: Date): Task[] => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return tasksByDate.get(dateKey) || [];
  };

  const periodLabel = useMemo(() => {
    if (view === 'month') return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    if (view === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 0 });
      const we = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(ws, 'dd MMM', { locale: ptBR })} – ${format(we, 'dd MMM yyyy', { locale: ptBR })}`;
    }
    return 'Próximas tarefas';
  }, [view, currentDate]);

  const navigatePeriod = (dir: 1 | -1) => {
    if (view === 'month') setCurrentDate((d) => (dir === 1 ? addMonths(d, 1) : subMonths(d, 1)));
    else if (view === 'week') setCurrentDate((d) => (dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1)));
    setAnimKey((k) => k + 1);
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

  const groupTasksForList = useMemo(() => {
    const today = new Date();
    const sorted = [...activeTasks].sort((a, b) => {
      const da = a.due_date ? parseLocalDate(a.due_date).getTime() : Infinity;
      const db = b.due_date ? parseLocalDate(b.due_date).getTime() : Infinity;
      return da - db;
    });

    const groups: { label: string; tasks: Task[] }[] = [
      { label: 'Atrasadas', tasks: [] },
      { label: 'Esta semana', tasks: [] },
      { label: 'Próxima semana', tasks: [] },
      { label: 'Este mês', tasks: [] },
      { label: 'Futuras', tasks: [] },
    ];

    const nextWeekStart = addWeeks(startOfWeek(today, { weekStartsOn: 0 }), 1);

    sorted.forEach((task) => {
      if (!task.due_date) return;
      const d = parseLocalDate(task.due_date);
      const todayStart = startOfDay(today);
      if (d < todayStart) groups[0].tasks.push(task);
      else if (isSameWeek(d, today, { weekStartsOn: 0 })) groups[1].tasks.push(task);
      else if (isSameWeek(d, nextWeekStart, { weekStartsOn: 0 })) groups[2].tasks.push(task);
      else if (isSameMonth(d, today)) groups[3].tasks.push(task);
      else groups[4].tasks.push(task);
    });

    return groups.filter((g) => g.tasks.length > 0);
  }, [activeTasks]);

  if (isLoading) {
    return (
      <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))', padding: 24 }}>
        <Skeleton className="h-8 w-48 mb-4" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))', padding: 18 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              display: 'grid',
              placeItems: 'center',
              background: 'hsl(var(--ds-accent) / 0.1)',
              color: 'hsl(var(--ds-accent))',
            }}
          >
            <CalendarDays size={16} strokeWidth={1.5} />
          </div>
          <div>
            <h3 style={{ fontFamily: '"HN Display", sans-serif', fontSize: 15, fontWeight: 600, color: 'hsl(var(--ds-fg-1))' }}>
              Calendário de Tarefas
            </h3>
            <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}>
              {activeTasks.length} {activeTasks.length === 1 ? 'tarefa ativa' : 'tarefas ativas'} com prazo
            </p>
          </div>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {view !== 'list' && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                className="btn"
                style={{ height: 26, padding: '0 10px', fontSize: 11 }}
                onClick={() => {
                  setCurrentDate(new Date());
                  setAnimKey((k) => k + 1);
                }}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => navigatePeriod(-1)}
                style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', background: 'transparent', border: 0, cursor: 'pointer', color: 'hsl(var(--ds-fg-3))' }}
                aria-label="Anterior"
              >
                <ChevronLeft size={14} strokeWidth={1.5} />
              </button>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  minWidth: 160,
                  textAlign: 'center',
                  textTransform: 'capitalize',
                  color: 'hsl(var(--ds-fg-1))',
                }}
              >
                {periodLabel}
              </span>
              <button
                type="button"
                onClick={() => navigatePeriod(1)}
                style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', background: 'transparent', border: 0, cursor: 'pointer', color: 'hsl(var(--ds-fg-3))' }}
                aria-label="Próximo"
              >
                <ChevronRight size={14} strokeWidth={1.5} />
              </button>
            </div>
          )}

          <div className="tabs-seg">
            {(['month', 'week', 'list'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setView(v);
                  setAnimKey((k) => k + 1);
                }}
                className={'seg' + (view === v ? ' on' : '')}
              >
                {v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : 'Lista'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div key={animKey}>
        {view === 'month' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
              {WEEKDAY_LABELS.map((d) => (
                <div
                  key={d}
                  style={{
                    textAlign: 'center',
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontWeight: 500,
                    color: 'hsl(var(--ds-fg-3))',
                    padding: '8px 0',
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
                gap: 1,
                background: 'hsl(var(--ds-line-1))',
                border: '1px solid hsl(var(--ds-line-1))',
              }}
            >
              {calendarDays.map((day, idx) => {
                const sameMonth = isSameMonth(day, currentDate);
                const dayTasks = sameMonth ? getTasksForDay(day) : [];
                const today = isToday(day);
                return (
                  <div
                    key={idx}
                    style={{
                      minHeight: 80,
                      padding: 6,
                      background: sameMonth
                        ? today
                          ? 'hsl(var(--ds-accent) / 0.05)'
                          : 'hsl(var(--ds-surface))'
                        : 'hsl(var(--ds-line-2) / 0.3)',
                      borderTop: today ? '2px solid hsl(var(--ds-accent))' : undefined,
                    }}
                  >
                    {today ? (
                      <span
                        style={{
                          display: 'inline-grid',
                          placeItems: 'center',
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: 'hsl(var(--ds-accent))',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {format(day, 'd')}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 11,
                          color: !sameMonth ? 'hsl(var(--ds-fg-4) / 0.5)' : 'hsl(var(--ds-fg-3))',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {format(day, 'd')}
                      </span>
                    )}
                    <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      {dayTasks.slice(0, 2).map((task) => {
                        const tone = priorityBg[task.priority] || priorityBg.standby;
                        return (
                          <div
                            key={task.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/tarefas/${task.id}`);
                            }}
                            style={{
                              fontSize: 10,
                              fontWeight: 500,
                              padding: '2px 5px',
                              cursor: 'pointer',
                              background: tone.bg,
                              color: tone.fg,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {task.title}
                          </div>
                        );
                      })}
                      {dayTasks.length > 2 && (
                        <span style={{ fontSize: 9, color: 'hsl(var(--ds-fg-4))', paddingLeft: 4, fontVariantNumeric: 'tabular-nums' }}>
                          +{dayTasks.length - 2} mais
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'week' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {calendarDays.map((day, idx) => {
              const dayTasks = getTasksForDay(day);
              const today = isToday(day);
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: 16,
                    padding: 12,
                    border: today ? '1px solid hsl(var(--ds-accent) / 0.4)' : '1px solid hsl(var(--ds-line-1))',
                    background: today ? 'hsl(var(--ds-accent) / 0.05)' : 'hsl(var(--ds-surface))',
                  }}
                >
                  <div style={{ textAlign: 'center', minWidth: 48 }}>
                    <p
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        color: 'hsl(var(--ds-fg-3))',
                      }}
                    >
                      {WEEKDAY_LABELS[day.getDay()]}
                    </p>
                    <p
                      style={{
                        fontFamily: '"HN Display", sans-serif',
                        fontSize: 22,
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                        color: today ? 'hsl(var(--ds-accent))' : 'hsl(var(--ds-fg-1))',
                      }}
                    >
                      {format(day, 'd')}
                    </p>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {dayTasks.length === 0 && (
                      <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))', padding: '4px 0' }}>Sem tarefas</p>
                    )}
                    {dayTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => navigate(`/tarefas/${task.id}`)}
                        style={{
                          padding: 8,
                          background: 'hsl(var(--ds-line-2) / 0.3)',
                          borderLeft: `2px solid ${priorityBorder[task.priority] ?? priorityBorder.standby}`,
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.6)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)';
                        }}
                      >
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
                          {task.title}
                        </p>
                        <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
                          {task.assignees?.[0]?.display_name?.split(' ')[0] || 'Sem responsável'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {groupTasksForList.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'hsl(var(--ds-fg-3))', padding: '32px 0', fontSize: 13 }}>
                Nenhuma tarefa com prazo definido
              </p>
            ) : (
              groupTasksForList.map((group) => (
                <div key={group.label}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <h4
                      style={{
                        fontSize: 11,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        color: 'hsl(var(--ds-fg-3))',
                      }}
                    >
                      {group.label}
                    </h4>
                    <span className="pill muted" style={{ fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>
                      {group.tasks.length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {group.tasks.map((task) => {
                      const d = task.due_date ? parseLocalDate(task.due_date) : new Date();
                      return (
                        <div
                          key={task.id}
                          onClick={() => navigate(`/tarefas/${task.id}`)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: 12,
                            border: '1px solid hsl(var(--ds-line-1))',
                            background: 'hsl(var(--ds-surface))',
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'hsl(var(--ds-surface))';
                          }}
                        >
                          <div
                            style={{
                              textAlign: 'center',
                              minWidth: 44,
                              padding: '6px 8px',
                              background: 'hsl(var(--ds-line-2))',
                            }}
                          >
                            <p
                              style={{
                                fontFamily: '"HN Display", sans-serif',
                                fontSize: 14,
                                fontWeight: 700,
                                lineHeight: 1,
                                fontVariantNumeric: 'tabular-nums',
                                color: 'hsl(var(--ds-fg-1))',
                              }}
                            >
                              {format(d, 'd')}
                            </p>
                            <p style={{ fontSize: 10, color: 'hsl(var(--ds-fg-3))', textTransform: 'capitalize', marginTop: 2 }}>
                              {format(d, 'MMM', { locale: ptBR })}
                            </p>
                          </div>
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
                              {task.title}
                            </p>
                            <p
                              style={{
                                fontSize: 11,
                                color: 'hsl(var(--ds-fg-3))',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {task.assignees?.[0]?.display_name || 'Sem responsável'}
                              {task.department && ` · ${task.department}`}
                            </p>
                          </div>
                          <PriorityBadge priority={task.priority} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
