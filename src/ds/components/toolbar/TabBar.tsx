import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TabBarItem<V extends string = string> {
  value: V;
  label: string;
  icon?: LucideIcon;
  /** Counter shown after the label (e.g. "Ativas 12"). */
  count?: number;
}

interface TabBarProps<V extends string = string> {
  items: TabBarItem<V>[];
  value: V;
  onChange: (value: V) => void;
  ariaLabel?: string;
}

/**
 * Canonical primary tab bar — wraps the `.tabs-bar` primitive with
 * `.ct` counter spans.
 *
 * Position rule (PageToolbar): slot 06, always left-aligned, full-width
 * underline above the content area.
 *
 * Use this for PRIMARY navigation (e.g. Tasks: Ativas / Minhas / Concluídas).
 * For categories-with-counts filtering, prefer `<FilterChipRow>` instead.
 */
export function TabBar<V extends string = string>({
  items,
  value,
  onChange,
  ariaLabel = 'Navegação',
}: TabBarProps<V>) {
  return (
    <div className="tabs-bar" role="tablist" aria-label={ariaLabel}>
      {items.map((it) => {
        const Icon = it.icon;
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            className={cn('tab', active && 'on')}
            onClick={() => onChange(it.value)}
            role="tab"
            aria-selected={active}
          >
            {Icon && <Icon />}
            {it.label}
            {it.count !== undefined && <span className="ct">{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
