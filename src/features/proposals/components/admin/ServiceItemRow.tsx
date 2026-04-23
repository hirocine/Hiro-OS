import { useEffect, useRef } from 'react';
import { MoreVertical, Trash2, Copy } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ServiceItem } from '@/lib/services-schema';

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
      className={`flex items-center gap-0 py-1.5 border-b border-white/5 last:border-b-0 group ${
        item.isCustom ? 'bg-primary/[0.02]' : ''
      }`}
    >
      {/* Checkbox */}
      <div className="w-5 flex-shrink-0 flex items-center justify-center">
        <Checkbox
          checked={item.included}
          onCheckedChange={(v) => onChange({ included: !!v })}
          aria-label={`Incluir ${item.label}`}
        />
      </div>

      {/* Label */}
      <div className="w-[180px] flex-shrink-0 pl-3 flex items-center gap-1.5 min-w-0">
        {item.isCustom ? (
          <Input
            ref={labelRef}
            value={item.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="—"
            className="h-8 text-sm border-0 shadow-none px-2 bg-white/[0.03] hover:bg-white/[0.05] focus-visible:bg-white/[0.05] focus-visible:ring-1"
          />
        ) : (
          <span className="text-sm text-foreground/90 truncate px-2">{item.label}</span>
        )}
        {item.isCustom && (
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 shrink-0">
            custom
          </Badge>
        )}
      </div>

      {/* Specification */}
      <div className="flex-1 min-w-0 pl-4 border-l border-white/[0.04]">
        <Input
          value={item.specification}
          onChange={(e) => onChange({ specification: e.target.value })}
          placeholder=""
          className="h-8 text-sm border-0 shadow-none px-2 bg-transparent hover:bg-white/[0.03] focus-visible:bg-white/[0.05] focus-visible:ring-1"
        />
      </div>

      {/* Quantity — input texto sem spinners */}
      <div className="w-20 flex-shrink-0 pl-4 border-l border-white/[0.04] flex justify-end pr-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={item.quantity}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '');
            onChange({ quantity: v === '' ? 1 : Math.max(1, parseInt(v, 10)) });
          }}
          className="w-12 h-8 bg-transparent border-0 text-sm text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-white/20 rounded px-1 hover:bg-white/[0.03]"
          aria-label={`Quantidade de ${item.label}`}
        />
      </div>

      {/* Menu */}
      <div className="w-8 flex-shrink-0 flex items-center justify-center">
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
