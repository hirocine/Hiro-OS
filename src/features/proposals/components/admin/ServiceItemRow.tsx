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
  onChange: (patch: Partial<Pick<ServiceItem, 'label' | 'specification' | 'quantity' | 'included'>>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

export function ServiceItemRow({ item, onChange, onRemove, onDuplicate }: Props) {
  return (
    <div
      className={`flex items-center gap-3 py-1.5 border-b border-white/5 last:border-b-0 group ${
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

      {/* Label — texto puro quando não custom */}
      <div className="w-[180px] flex-shrink-0 flex items-center gap-1.5 min-w-0">
        {item.isCustom ? (
          <Input
            value={item.label}
            onChange={(e) => onChange({ label: e.target.value })}
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
      <div className="flex-1 min-w-0">
        <Input
          value={item.specification}
          onChange={(e) => onChange({ specification: e.target.value })}
          placeholder="Ex: Canon C70 + Sony FX3…"
          className="h-8 text-sm border-0 shadow-none px-2 bg-transparent hover:bg-white/[0.03] focus-visible:bg-white/[0.05] focus-visible:ring-1"
        />
      </div>

      {/* Quantity */}
      <div className="w-16 flex-shrink-0">
        <Input
          type="number"
          min={1}
          value={item.quantity}
          onChange={(e) => onChange({ quantity: Number(e.target.value) || 1 })}
          className="h-8 text-sm text-right tabular-nums px-2 border-0 shadow-none bg-transparent hover:bg-white/[0.03] focus-visible:bg-white/[0.05] focus-visible:ring-1"
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
