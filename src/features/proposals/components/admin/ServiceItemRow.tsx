import { useEffect, useRef } from 'react';
import { MoreVertical, Trash2, Copy } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
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

const cellBorder = '1px solid hsl(var(--ds-line-1))';

export function ServiceItemRow({ item, autoFocusLabel, onChange, onRemove, onDuplicate }: Props) {
  const labelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocusLabel && labelRef.current) {
      labelRef.current.focus();
    }
  }, [autoFocusLabel]);

  return (
    <div
      className={ROW_GRID + ' group'}
      style={{
        minHeight: 40,
        borderBottom: '1px solid hsl(var(--ds-line-1))',
        background: item.isCustom ? 'hsl(var(--ds-accent) / 0.04)' : undefined,
      }}
    >
      {/* Checkbox */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Checkbox
          checked={item.included}
          onCheckedChange={(v) => onChange({ included: !!v })}
          aria-label={`Incluir ${item.label}`}
        />
      </div>

      {/* Label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '0 12px',
          borderLeft: cellBorder,
          fontSize: 13,
          minWidth: 0,
          color: 'hsl(var(--ds-fg-1))',
        }}
      >
        {item.isCustom ? (
          <input
            ref={labelRef}
            value={item.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="—"
            style={{
              flex: 1,
              minWidth: 0,
              background: 'transparent',
              border: 0,
              outline: 'none',
              padding: '4px 4px',
              margin: '0 -4px',
              fontSize: 13,
              color: 'inherit',
            }}
          />
        ) : (
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.label}
          </span>
        )}
        {item.isCustom && (
          <span
            className="pill muted"
            style={{ fontSize: 9, padding: '0 6px', height: 16, lineHeight: '16px', flexShrink: 0 }}
          >
            custom
          </span>
        )}
      </div>

      {/* Specification */}
      <div style={{ borderLeft: cellBorder, display: 'flex', alignItems: 'stretch', minWidth: 0 }}>
        <input
          value={item.specification}
          onChange={(e) => onChange({ specification: e.target.value })}
          placeholder=""
          disabled={!item.included}
          style={{
            width: '100%',
            background: 'transparent',
            border: 0,
            outline: 'none',
            padding: '0 12px',
            fontSize: 13,
            color: 'hsl(var(--ds-fg-1))',
            opacity: item.included ? 1 : 0.5,
          }}
        />
      </div>

      {/* Quantity */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: 12,
          borderLeft: cellBorder,
        }}
      >
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
          style={{
            width: 44,
            height: 28,
            background: 'hsl(var(--ds-line-2) / 0.4)',
            border: '1px solid hsl(var(--ds-line-1))',
            padding: '0 8px',
            fontSize: 13,
            textAlign: 'center',
            fontVariantNumeric: 'tabular-nums',
            outline: 'none',
            color: 'hsl(var(--ds-fg-1))',
            opacity: item.included ? 1 : 0.5,
          }}
          aria-label={`Quantidade de ${item.label}`}
        />
      </div>

      {/* Menu */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderLeft: cellBorder,
        }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            style={{
              width: 28,
              height: 28,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 0,
              cursor: 'pointer',
              color: 'hsl(var(--ds-fg-3))',
              transition: 'color 0.15s, background 0.15s',
            }}
            aria-label="Mais opções"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.4)';
              e.currentTarget.style.color = 'hsl(var(--ds-fg-1))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'hsl(var(--ds-fg-3))';
            }}
          >
            <MoreVertical size={14} strokeWidth={1.5} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy size={13} strokeWidth={1.5} style={{ marginRight: 8 }} /> Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onRemove}
              style={{ color: 'hsl(var(--ds-danger))' }}
            >
              <Trash2 size={13} strokeWidth={1.5} style={{ marginRight: 8 }} /> Remover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
