import { useEffect, useRef } from 'react';
import { MoreVertical, Trash2, Copy } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ServiceItem } from '@/lib/services-schema';

export const ROW_GRID = 'grid grid-cols-[32px_200px_1fr_70px_32px] items-stretch';

interface Props {
  item: ServiceItem;
  autoFocusLabel?: boolean;
  onChange: (patch: Partial<Pick<ServiceItem, 'label' | 'specification' | 'quantity' | 'included'>>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

export function ServiceItemRow({ item, autoFocusLabel, onChange, onRemove, onDuplicate }: Props) {
  const labelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocusLabel && labelRef.current) {
      labelRef.current.focus();
    }
  }, [autoFocusLabel]);

  return (
    <div
      className={`${ROW_GRID} border-b border-border/50 last:border-b-0 min-h-[40px] group ${
        item.isCustom ? 'bg-primary/[0.02]' : ''
      }`}
    >
      {/* Checkbox */}
      <div className="flex items-center justify-center">
        <Checkbox
          checked={item.included}
          onCheckedChange={(v) => onChange({ included: !!v })}
          aria-label={`Incluir ${item.label}`}
        />
      </div>

      {/* Label */}
      <div className="flex items-center gap-1.5 px-3 border-l border-border/50 text-[13px] min-w-0">
        {item.isCustom ? (
          <input
            ref={labelRef}
            value={item.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="—"
            className="flex-1 min-w-0 bg-transparent border-0 outline-none py-1 text-[13px] focus:bg-accent/30 rounded-sm px-1 -mx-1"
          />
        ) : (
          <span className="text-foreground/90 truncate">{item.label}</span>
        )}
        {item.isCustom && (
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 shrink-0">
            custom
          </Badge>
        )}
      </div>

      {/* Specification */}
      <div className="border-l border-border/50 flex items-stretch min-w-0">
        <input
          value={item.specification}
          onChange={(e) => onChange({ specification: e.target.value })}
          placeholder=""
          disabled={!item.included}
          className="w-full bg-transparent border-0 outline-none px-3 text-[13px] focus:bg-accent/30 disabled:opacity-50"
        />
      </div>

      {/* Quantity */}
      <div className="flex items-center justify-end pr-3 border-l border-border/50">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={item.quantity}
          disabled={!item.included}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '');
            onChange({ quantity: v === '' ? 1 : Math.max(1, parseInt(v, 10)) });
          }}
          className="w-11 h-7 bg-muted/30 border border-border rounded-md px-2 text-[13px] text-center tabular-nums outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          aria-label={`Quantidade de ${item.label}`}
        />
      </div>

      {/* Menu */}
      <div className="flex items-center justify-center border-l border-border/50">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors opacity-60 group-hover:opacity-100"
            aria-label="Mais opções"
          >
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="h-3.5 w-3.5 mr-2" /> Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRemove} className="text-destructive focus:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Remover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
