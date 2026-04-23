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
  isLast: boolean;
  onChange: (patch: Partial<Pick<ServiceItem, 'label' | 'specification' | 'quantity' | 'included'>>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

export function ServiceItemRow({ item, isLast, onChange, onRemove, onDuplicate }: Props) {
  return (
    <div
      className={`grid grid-cols-[24px_minmax(140px,1.2fr)_minmax(180px,2fr)_72px_32px] gap-3 items-center py-2 px-2 -mx-2 rounded-md transition-colors hover:bg-muted/40 ${
        isLast ? '' : 'border-b border-border/40'
      } ${item.isCustom ? 'bg-primary/[0.03]' : ''}`}
    >
      <Checkbox
        checked={item.included}
        onCheckedChange={(v) => onChange({ included: !!v })}
        aria-label={`Incluir ${item.label}`}
      />

      <div className="flex items-center gap-2 min-w-0">
        <Input
          value={item.label}
          readOnly={!item.isCustom}
          onChange={(e) => onChange({ label: e.target.value })}
          className={`h-8 text-sm border-0 shadow-none px-2 focus-visible:ring-1 ${
            item.isCustom ? 'bg-background' : 'bg-transparent cursor-default'
          }`}
        />
        {item.isCustom && (
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 shrink-0">
            custom
          </Badge>
        )}
      </div>

      <Input
        value={item.specification}
        onChange={(e) => onChange({ specification: e.target.value })}
        placeholder="Ex: Canon C70 + Sony FX3…"
        className="h-8 text-sm border-0 shadow-none px-2 focus-visible:ring-1 bg-background/60"
      />

      <Input
        type="number"
        min={1}
        value={item.quantity}
        onChange={(e) => onChange({ quantity: Number(e.target.value) || 1 })}
        className="h-8 text-sm text-right tabular-nums px-2 bg-background/60"
      />

      <DropdownMenu>
        <DropdownMenuTrigger
          className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
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
  );
}
