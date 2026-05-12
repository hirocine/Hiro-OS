import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DateRange as DayPickerRange } from 'react-day-picker';

export type PeriodPreset =
  | 'today'
  | '7' | '30' | '90'
  | 'this_month' | 'last_month'
  | 'all' | 'custom';

export interface PeriodDateRange {
  start: Date;
  end: Date;
}

export const PERIOD_OPTIONS: { value: PeriodPreset; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: 'this_month', label: 'Este mês' },
  { value: 'last_month', label: 'Mês passado' },
  { value: 'all', label: 'Todo o período' },
  { value: 'custom', label: 'Personalizado…' },
];

interface Props {
  preset: PeriodPreset;
  customRange: PeriodDateRange | null;
  oldestSnapshotDate: Date | null;
  onPresetChange: (preset: PeriodPreset) => void;
  onCustomRangeChange: (range: PeriodDateRange) => void;
  customPickerOpen: boolean;
  onCustomPickerOpenChange: (open: boolean) => void;
}

export function PeriodPicker({
  preset,
  customRange,
  oldestSnapshotDate,
  onPresetChange,
  onCustomRangeChange,
  customPickerOpen,
  onCustomPickerOpenChange,
}: Props) {
  const [draftRange, setDraftRange] = useState<DayPickerRange | undefined>(
    customRange ? { from: customRange.start, to: customRange.end } : undefined
  );

  // Sincroniza draft quando o popover abrir
  useEffect(() => {
    if (customPickerOpen) {
      setDraftRange(
        customRange ? { from: customRange.start, to: customRange.end } : undefined
      );
    }
  }, [customPickerOpen, customRange]);

  const presetLabel = (() => {
    if (preset === 'custom' && customRange) {
      const startStr = format(customRange.start, 'dd/MM/yy', { locale: ptBR });
      const endStr = format(customRange.end, 'dd/MM/yy', { locale: ptBR });
      return `${startStr} → ${endStr}`;
    }
    return PERIOD_OPTIONS.find(o => o.value === preset)?.label ?? 'Período';
  })();

  return (
    <div className="relative inline-flex">
      <Select
        value={preset}
        onValueChange={(v) => onPresetChange(v as PeriodPreset)}
      >
        <SelectTrigger className="h-9 w-[200px] gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <SelectValue>
            <span className="font-numeric truncate">{presetLabel}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {PERIOD_OPTIONS.map(o => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={customPickerOpen} onOpenChange={onCustomPickerOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="absolute right-0 top-1/2 h-0 w-0 -translate-y-1/2 opacity-0 pointer-events-none"
          />
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="end"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="p-3 border-b border-[hsl(var(--ds-line-1))]">
            <p className="text-sm font-medium">Período personalizado</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Selecione data inicial e final
            </p>
          </div>
          <Calendar
            mode="range"
            selected={draftRange}
            onSelect={setDraftRange}
            numberOfMonths={2}
            locale={ptBR}
            disabled={(date) => {
              const today = new Date();
              today.setHours(23, 59, 59, 999);
              if (date > today) return true;
              if (oldestSnapshotDate) {
                const oldest = new Date(oldestSnapshotDate);
                oldest.setHours(0, 0, 0, 0);
                if (date < oldest) return true;
              }
              return false;
            }}
            className={cn('p-3 pointer-events-auto')}
          />
          <div className="flex items-center justify-end gap-2 p-3 border-t border-[hsl(var(--ds-line-1))]">
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => {
                onCustomPickerOpenChange(false);
                setDraftRange(
                  customRange ? { from: customRange.start, to: customRange.end } : undefined
                );
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn primary sm"
              disabled={!draftRange?.from || !draftRange?.to}
              onClick={() => {
                if (draftRange?.from && draftRange?.to) {
                  onCustomRangeChange({
                    start: draftRange.from,
                    end: draftRange.to,
                  });
                }
              }}
            >
              Aplicar
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
