import { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

type PeriodMode = 'month' | 'range' | 'preset';

interface PeriodPickerMonthProps {
  mode: 'month';
  value: Date;
  onChange: (date: Date) => void;
}

interface PeriodPickerRangeProps {
  mode: 'range';
  value: { from?: Date; to?: Date };
  onChange: (range: { from?: Date; to?: Date }) => void;
}

interface PeriodPickerPresetProps {
  mode: 'preset';
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

type PeriodPickerProps = PeriodPickerMonthProps | PeriodPickerRangeProps | PeriodPickerPresetProps;

const MONTH_LABELS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/**
 * Canonical period picker.
 *
 * Position rule (PageToolbar): SEMPRE imediatamente após o `<ViewToggle>`.
 * When no view toggle exists (e.g. Marketing Dashboard), sits in the same
 * right-side slot of the toolbar by itself.
 *
 * Three modes:
 *   - `month`  → "mai 2026 ◂ ▸"  (calendar view scope)
 *   - `range`  → date range popover
 *   - `preset` → "Últimos 30 dias ▾"  (preset list)
 */
export function PeriodPicker(props: PeriodPickerProps) {
  if (props.mode === 'month') {
    return <MonthPicker value={props.value} onChange={props.onChange} />;
  }
  if (props.mode === 'preset') {
    return <PresetPicker value={props.value} options={props.options} onChange={props.onChange} />;
  }
  return <RangePicker value={props.value} onChange={props.onChange} />;
}

function MonthPicker({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  const monthLabel = `${MONTH_LABELS[value.getMonth()]} ${value.getFullYear()}`;

  const goPrev = () => {
    const d = new Date(value);
    d.setMonth(d.getMonth() - 1);
    onChange(d);
  };
  const goNext = () => {
    const d = new Date(value);
    d.setMonth(d.getMonth() + 1);
    onChange(d);
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1px solid hsl(var(--ds-line-2))',
        height: 34,
      }}
    >
      <button
        type="button"
        onClick={goPrev}
        aria-label="Mês anterior"
        style={{
          width: 28,
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          background: 'transparent',
          border: 0,
          borderRight: '1px solid hsl(var(--ds-line-2))',
          cursor: 'pointer',
          color: 'hsl(var(--ds-fg-3))',
        }}
      >
        <ChevronLeft size={12} strokeWidth={1.75} />
      </button>
      <span
        style={{
          padding: '0 12px',
          fontFamily: '"HN Display", sans-serif',
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          fontWeight: 500,
          color: 'hsl(var(--ds-fg-1))',
          fontVariantNumeric: 'tabular-nums',
          minWidth: 110,
          textAlign: 'center',
        }}
      >
        {monthLabel}
      </span>
      <button
        type="button"
        onClick={goNext}
        aria-label="Próximo mês"
        style={{
          width: 28,
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          background: 'transparent',
          border: 0,
          borderLeft: '1px solid hsl(var(--ds-line-2))',
          cursor: 'pointer',
          color: 'hsl(var(--ds-fg-3))',
        }}
      >
        <ChevronRight size={12} strokeWidth={1.75} />
      </button>
    </div>
  );
}

function PresetPicker({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="btn"
          style={{ height: 34 }}
          aria-label="Selecionar período"
        >
          <CalendarDays size={12} strokeWidth={1.5} />
          <span>{current?.label ?? 'Período'}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              style={{
                padding: '8px 14px',
                background: 'transparent',
                border: 0,
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: 13,
                color:
                  o.value === value ? 'hsl(var(--ds-accent))' : 'hsl(var(--ds-fg-1))',
                fontWeight: o.value === value ? 500 : 400,
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function RangePicker({
  value,
  onChange,
}: {
  value: { from?: Date; to?: Date };
  onChange: (r: { from?: Date; to?: Date }) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = (() => {
    if (value.from && value.to) {
      const f = `${String(value.from.getDate()).padStart(2, '0')}/${String(value.from.getMonth() + 1).padStart(2, '0')}`;
      const t = `${String(value.to.getDate()).padStart(2, '0')}/${String(value.to.getMonth() + 1).padStart(2, '0')}`;
      return `${f} → ${t}`;
    }
    return 'Período';
  })();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="btn" style={{ height: 34 }}>
          <CalendarDays size={12} strokeWidth={1.5} />
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          selected={value as any}
          onSelect={(r: any) => onChange(r ?? {})}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
