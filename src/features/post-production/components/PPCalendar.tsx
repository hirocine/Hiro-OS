import { useMemo, useState } from 'react';
import { PostProductionItem, PP_STATUS_CONFIG } from '../types';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PPCalendarProps {
  items: PostProductionItem[];
  onItemClick?: (item: PostProductionItem) => void;
}

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Monday = 0, Sunday = 6
  let startDow = (firstDay.getDay() + 6) % 7;
  
  const days: Date[] = [];
  
  // Previous month padding
  for (let i = startDow - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  
  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  
  // Next month padding to complete grid
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1];
    days.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
  }
  
  return days;
}

function dateToKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const STATUS_CHIP_COLORS: Record<string, string> = {
  fila: 'bg-muted text-muted-foreground',
  edicao: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  color_grading: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  finalizacao: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  revisao: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  entregue: 'bg-green-500/15 text-green-700 dark:text-green-400',
};

export function PPCalendar({ items, onItemClick }: PPCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const days = useMemo(() => getMonthGrid(currentYear, currentMonth), [currentYear, currentMonth]);

  const itemsByDate = useMemo(() => {
    const map: Record<string, PostProductionItem[]> = {};
    items.forEach(item => {
      if (item.due_date) {
        if (!map[item.due_date]) map[item.due_date] = [];
        map[item.due_date].push(item);
      }
    });
    return map;
  }, [items]);

  const todayKey = dateToKey(today);

  const goToPrev = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const goToNext = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const monthLabel = new Date(currentYear, currentMonth).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrev} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNext} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold capitalize ml-2">{monthLabel}</h2>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>Hoje</Button>
      </div>

      {/* Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-muted/50">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground border-b">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const key = dateToKey(day);
            const isCurrentMonth = day.getMonth() === currentMonth;
            const isToday = key === todayKey;
            const dayItems = itemsByDate[key] || [];

            return (
              <div
                key={i}
                className={cn(
                  'min-h-[110px] lg:min-h-[120px] border-b border-r p-1.5 flex flex-col',
                  !isCurrentMonth && 'bg-muted/30',
                  isToday && 'bg-primary/5'
                )}
              >
                {/* Day number */}
                <span className={cn(
                  'text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                  !isCurrentMonth && 'text-muted-foreground/50',
                  isToday && 'bg-primary text-primary-foreground font-bold'
                )}>
                  {day.getDate()}
                </span>

                {/* Video chips */}
                <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                  {dayItems.slice(0, 3).map(item => (
                    <button
                      key={item.id}
                      onClick={() => onItemClick?.(item)}
                      className={cn(
                        'text-[11px] leading-tight px-1.5 py-0.5 rounded truncate text-left font-medium transition-opacity hover:opacity-80',
                        STATUS_CHIP_COLORS[item.status] || 'bg-muted text-muted-foreground'
                      )}
                      title={`${item.title} — ${PP_STATUS_CONFIG[item.status]?.label || item.status}`}
                    >
                      {item.title}
                    </button>
                  ))}
                  {dayItems.length > 3 && (
                    <span className="text-[10px] text-muted-foreground pl-1">
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
