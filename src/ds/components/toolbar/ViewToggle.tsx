import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ViewToggleItem<V extends string = string> {
  value: V;
  label: string;
  icon?: LucideIcon;
}

interface ViewToggleProps<V extends string = string> {
  items: ViewToggleItem<V>[];
  value: V;
  onChange: (value: V) => void;
  ariaLabel?: string;
}

/**
 * Canonical view toggle — segmented bar using `.tabs-seg`.
 *
 * Position rule (PageToolbar): SEMPRE no extremo direito da toolbar.
 * Groups with `<PeriodPicker>` when present.
 *
 * Replaces:
 *   - `.tabs-bar` underline used by PostProduction for the same 3-way control
 *   - inline-styled segmented buttons in various places
 */
export function ViewToggle<V extends string = string>({
  items,
  value,
  onChange,
  ariaLabel = 'Alternar visualização',
}: ViewToggleProps<V>) {
  return (
    <div className="tabs-seg" role="tablist" aria-label={ariaLabel}>
      {items.map((it) => {
        const Icon = it.icon;
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            className={cn('s', active && 'on')}
            onClick={() => onChange(it.value)}
            role="tab"
            aria-selected={active}
          >
            {Icon && <Icon />}
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
