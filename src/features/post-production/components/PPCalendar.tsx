import { useMemo, useState } from 'react';
import { PostProductionItem, PP_STATUS_CONFIG } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PPCalendarProps {
  items: PostProductionItem[];
  onItemClick?: (item: PostProductionItem) => void;
}

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const statusChipBg: Record<string, { bg: string; fg: string }> = {
  fila:              { bg: 'hsl(var(--ds-line-2))', fg: 'hsl(var(--ds-fg-3))' },
  edicao:            { bg: 'hsl(var(--ds-info) / 0.15)', fg: 'hsl(var(--ds-info))' },
  color_grading:     { bg: 'hsl(280 70% 60% / 0.15)', fg: 'hsl(280 70% 60%)' },
  finalizacao:       { bg: 'hsl(var(--ds-warning) / 0.15)', fg: 'hsl(var(--ds-warning))' },
  revisao:           { bg: 'hsl(var(--ds-warning) / 0.1)', fg: 'hsl(var(--ds-warning))' },
  validacao_cliente: { bg: 'hsl(var(--ds-info) / 0.1)', fg: 'hsl(var(--ds-info))' },
  entregue:          { bg: 'hsl(var(--ds-success) / 0.15)', fg: 'hsl(var(--ds-success))' },
};

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;
  const days: Date[] = [];

  for (let i = startDow - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1];
    days.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
  }
  return days;
}

function dateToKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function PPCalendar({ items, onItemClick }: PPCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const days = useMemo(() => getMonthGrid(currentYear, currentMonth), [currentYear, currentMonth]);

  const itemsByDate = useMemo(() => {
    const map: Record<string, PostProductionItem[]> = {};
    items.forEach((item) => {
      if (item.due_date) {
        if (!map[item.due_date]) map[item.due_date] = [];
        map[item.due_date].push(item);
      }
    });
    return map;
  }, [items]);

  const todayKey = dateToKey(today);

  const goToPrev = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else setCurrentMonth((m) => m - 1);
  };

  const goToNext = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else setCurrentMonth((m) => m + 1);
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const monthLabel = new Date(currentYear, currentMonth).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={goToPrev}
            className="btn"
            style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}
            aria-label="Mês anterior"
          >
            <ChevronLeft size={14} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="btn"
            style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}
            aria-label="Próximo mês"
          >
            <ChevronRight size={14} strokeWidth={1.5} />
          </button>
          <h2
            style={{
              fontFamily: '"HN Display", sans-serif',
              fontSize: 16,
              fontWeight: 600,
              color: 'hsl(var(--ds-fg-1))',
              textTransform: 'capitalize',
              marginLeft: 8,
            }}
          >
            {monthLabel}
          </h2>
        </div>
        <button type="button" onClick={goToToday} className="btn">
          Hoje
        </button>
      </div>

      <div style={{ border: '1px solid hsl(var(--ds-line-1))', overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            background: 'hsl(var(--ds-line-2) / 0.4)',
            borderBottom: '1px solid hsl(var(--ds-line-1))',
          }}
        >
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              style={{
                padding: '8px 0',
                textAlign: 'center',
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 500,
                color: 'hsl(var(--ds-fg-3))',
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
          }}
        >
          {days.map((day, i) => {
            const key = dateToKey(day);
            const isCurrentMonth = day.getMonth() === currentMonth;
            const isToday = key === todayKey;
            const dayItems = itemsByDate[key] || [];

            return (
              <div
                key={i}
                style={{
                  minHeight: 110,
                  padding: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  background: isToday
                    ? 'hsl(var(--ds-accent) / 0.05)'
                    : isCurrentMonth
                      ? 'hsl(var(--ds-surface))'
                      : 'hsl(var(--ds-line-2) / 0.3)',
                  borderTop: isToday ? '2px solid hsl(var(--ds-accent))' : undefined,
                }}
              >
                {isToday ? (
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
                      marginBottom: 4,
                    }}
                  >
                    {day.getDate()}
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: !isCurrentMonth ? 'hsl(var(--ds-fg-4) / 0.5)' : 'hsl(var(--ds-fg-3))',
                      fontVariantNumeric: 'tabular-nums',
                      marginBottom: 4,
                    }}
                  >
                    {day.getDate()}
                  </span>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden', flex: 1, minWidth: 0 }}>
                  {dayItems.slice(0, 3).map((item) => {
                    const tone = statusChipBg[item.status] || statusChipBg.fila;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onItemClick?.(item)}
                        title={`${item.title} — ${PP_STATUS_CONFIG[item.status]?.label || item.status}`}
                        style={{
                          fontSize: 10,
                          lineHeight: 1.2,
                          padding: '2px 5px',
                          fontWeight: 500,
                          textAlign: 'left',
                          background: tone.bg,
                          color: tone.fg,
                          border: 0,
                          cursor: 'pointer',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        {item.title}
                      </button>
                    );
                  })}
                  {dayItems.length > 3 && (
                    <span style={{ fontSize: 9, color: 'hsl(var(--ds-fg-4))', paddingLeft: 4, fontVariantNumeric: 'tabular-nums' }}>
                      +{dayItems.length - 3} mais
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
