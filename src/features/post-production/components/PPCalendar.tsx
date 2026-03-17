import { useMemo, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { PPStatusBadge } from './PPStatusBadge';
import { PPPriorityBadge } from './PPPriorityBadge';
import { PostProductionItem } from '../types';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface PPCalendarProps {
  items: PostProductionItem[];
  onItemClick?: (item: PostProductionItem) => void;
}

export function PPCalendar({ items, onItemClick }: PPCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

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

  const datesWithItems = useMemo(() => {
    return Object.keys(itemsByDate).map(d => new Date(d + 'T00:00:00'));
  }, [itemsByDate]);

  const selectedDateStr = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    : null;

  const selectedItems = selectedDateStr ? (itemsByDate[selectedDateStr] || []) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
      <div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className={cn("p-3 pointer-events-auto rounded-lg border")}
          modifiers={{
            hasItems: datesWithItems,
          }}
          modifiersClassNames={{
            hasItems: 'bg-primary/20 font-bold text-primary',
          }}
        />
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground">
          {selectedDate
            ? `Vídeos com prazo em ${selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`
            : 'Selecione uma data'}
        </h3>
        {selectedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum vídeo com prazo nesta data.</p>
        ) : (
          selectedItems.map(item => (
            <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onItemClick?.(item)}>
              <CardContent className="p-4 flex flex-col gap-2">
                <p className="font-medium text-sm">{item.title}</p>
                {(item.project_name || item.client_name) && (
                  <p className="text-xs text-muted-foreground">{item.project_name || item.client_name}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <PPStatusBadge status={item.status} />
                  <PPPriorityBadge priority={item.priority} />
                  {item.editor_name && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {item.editor_name}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
