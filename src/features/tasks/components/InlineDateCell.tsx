import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

interface InlineDateCellProps {
  value: string | null;
  onSave: (newDate: string | null) => void;
  className?: string;
  /**
   * If true, treats the date as "delivered/completed" — no more
   * "Atrasada" / "Vence em X". Shows the date in success tone with
   * a "(Concluída)" hint. Defaults to false.
   */
  isDone?: boolean;
}

const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export function InlineDateCell({ value, onSave, className = '', isDone = false }: InlineDateCellProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getDueDateLabel = (dueDate: string) => {
    // Task completed → no more "Atrasada" / "Vence em" — show "Concluída" in green
    if (isDone) {
      return (
        <span style={{ fontSize: 11, color: 'hsl(var(--ds-success))', fontWeight: 500 }}>
          (Concluída)
        </span>
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = parseLocalDate(dueDate);
    due.setHours(0, 0, 0, 0);
    const daysUntilDue = differenceInDays(due, today);

    if (daysUntilDue < 0) {
      return (
        <span style={{ fontSize: 11, color: 'hsl(var(--ds-danger))', fontWeight: 500 }}>
          (Atrasada há {Math.abs(daysUntilDue)} {Math.abs(daysUntilDue) === 1 ? 'dia' : 'dias'})
        </span>
      );
    } else if (daysUntilDue === 0) {
      return (
        <span style={{ fontSize: 11, color: 'hsl(var(--ds-warning))', fontWeight: 500 }}>
          (Vence hoje)
        </span>
      );
    } else if (daysUntilDue === 1) {
      return (
        <span style={{ fontSize: 11, color: 'hsl(var(--ds-warning))', fontWeight: 500 }}>
          (Entrega amanhã)
        </span>
      );
    } else {
      return (
        <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
          (Entrega em {daysUntilDue} {daysUntilDue === 1 ? 'dia' : 'dias'})
        </span>
      );
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onSave(format(date, 'yyyy-MM-dd'));
      setIsOpen(false);
    }
  };

  const handleRemoveDate = () => {
    onSave(null);
    setIsOpen(false);
  };

  return (
    <div onClick={(e) => e.stopPropagation()} className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
            style={{
              background: 'transparent',
              border: 0,
              padding: 0,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
            }}
          >
            {value ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span
                  style={{
                    fontSize: 13,
                    color: isDone ? 'hsl(var(--ds-success))' : 'hsl(var(--ds-fg-1))',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {format(parseLocalDate(value), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
                {getDueDateLabel(value)}
              </div>
            ) : (
              <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-4))' }}>Sem prazo</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
          <Calendar
            mode="single"
            selected={value ? parseLocalDate(value) : undefined}
            defaultMonth={value ? parseLocalDate(value) : undefined}
            onSelect={handleDateSelect}
            initialFocus
            className="p-3 pointer-events-auto"
          />
          {value && (
            <div style={{ padding: 8, borderTop: '1px solid hsl(var(--ds-line-2))' }}>
              <button
                type="button"
                onClick={handleRemoveDate}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: 12,
                  color: 'hsl(var(--ds-fg-2))',
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <X size={13} strokeWidth={1.5} />
                Remover prazo
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
