import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, ChevronDown, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InlineDateCellProps {
  value: string | null;
  onSave: (newDate: string | null) => void;
  className?: string;
}

export function InlineDateCell({ value, onSave, className = '' }: InlineDateCellProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getDueDateLabel = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const daysUntilDue = differenceInDays(due, today);

    if (daysUntilDue < 0) {
      return (
        <span className="text-xs text-destructive font-medium">
          (Atrasada há {Math.abs(daysUntilDue)} {Math.abs(daysUntilDue) === 1 ? 'dia' : 'dias'})
        </span>
      );
    } else if (daysUntilDue === 0) {
      return <span className="text-xs text-yellow-600 font-medium">(Vence hoje)</span>;
    } else if (daysUntilDue === 1) {
      return <span className="text-xs text-yellow-600 font-medium">(Entrega amanhã)</span>;
    } else {
      return (
        <span className="text-xs text-muted-foreground">
          (Entrega em {daysUntilDue} {daysUntilDue === 1 ? 'dia' : 'dias'})
        </span>
      );
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onSave(date.toISOString());
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
          <Button
            variant="ghost"
            className={cn(
              "h-auto min-h-0 w-full justify-start p-0 font-normal bg-transparent hover:bg-transparent rounded transition-colors",
              !value && "text-muted-foreground"
            )}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
          >
            {value ? (
              <div className="flex items-center gap-2 w-full">
                <div className="flex flex-col gap-0.5 flex-1">
                  <span className="text-sm">
                    {format(new Date(value), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                  {getDueDateLabel(value)}
                </div>
                <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <span className="text-sm">Sem prazo</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={handleDateSelect}
            initialFocus
            className="p-3 pointer-events-auto"
          />
          {value && (
            <div className="p-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-destructive"
                onClick={handleRemoveDate}
              >
                <X className="w-4 h-4 mr-2" />
                Remover prazo
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
