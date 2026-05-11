import { useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CollapsibleSectionProps {
  /** Eyebrow number (e.g. "01", "02"). Optional. */
  number?: string;
  /** Section title — rendered with HN Display. */
  title: string;
  /** Optional icon shown before the title (e.g. `Film` for projects). */
  icon?: LucideIcon;
  /** Item count — renders "X ITEM/ITENS" eyebrow at the right edge. */
  count?: number;
  /** Custom noun pair for pluralization. Default: `['ITEM', 'ITENS']`. */
  itemNoun?: [singular: string, plural: string];
  /** Render with collapse/expand chevron and click-to-toggle. */
  collapsible?: boolean;
  /** Initial open state when collapsible. Default: false. */
  defaultOpen?: boolean;
  /**
   * Controlled open state. If provided, component is controlled.
   * Use together with `onOpenChange`.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Extra slot rendered before the count (e.g. "Ordenado por mais recente"). */
  rightSlot?: ReactNode;
  /** Section body. */
  children: ReactNode;
}

const DEFAULT_NOUN: [string, string] = ['ITEM', 'ITENS'];

/**
 * Canonical numbered section with optional collapse.
 *
 * Layout grammar (always — edge-aligned per DS rule):
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ 01  [Icon?]  Title                ⟨rightSlot⟩  X ITENS  [▾]   │
 *   └────────────────────────────────────────────────────────────────┘
 *     ↑    ↑       ↑                     ↑           ↑         ↑
 *     │    │       │                     │           │         └─ chevron (collapsible only)
 *     │    │       │                     │           └─ count (auto-pluralized)
 *     │    │       │                     └─ optional meta (e.g. sort order)
 *     │    │       └─ HN Display
 *     │    └─ optional icon
 *     └─ optional number eyebrow
 *
 * Replaces the various inline section-head implementations across pages:
 * Tasks (chevron-down rotating), Proposals (chevron-right static),
 * Projects AV (icon prefix), PP Entregues (gray bar — total outlier).
 */
export function CollapsibleSection({
  number,
  title,
  icon: Icon,
  count,
  itemNoun = DEFAULT_NOUN,
  collapsible = false,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  rightSlot,
  children,
}: CollapsibleSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const handleOpenChange = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const countLabel =
    count !== undefined ? `${count} ${count === 1 ? itemNoun[0] : itemNoun[1]}` : null;

  const header = (
    <div
      className="section-head"
      style={collapsible ? { cursor: 'pointer' } : undefined}
    >
      <div className="section-head-l">
        {number && <span className="section-eyebrow">{number}</span>}
        {Icon && (
          <Icon
            size={14}
            strokeWidth={1.5}
            style={{ color: 'hsl(var(--ds-fg-3))', marginRight: 4 }}
          />
        )}
        <span className="section-title">{title}</span>
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
        {rightSlot && (
          <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))' }}>{rightSlot}</span>
        )}
        {countLabel && (
          <span
            className="section-eyebrow"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {countLabel}
          </span>
        )}
        {collapsible && (
          <ChevronDown
            size={14}
            strokeWidth={1.5}
            style={{
              color: 'hsl(var(--ds-fg-3))',
              transition: 'transform 0.2s',
              transform: open ? 'rotate(180deg)' : 'none',
            }}
          />
        )}
      </div>
    </div>
  );

  if (!collapsible) {
    return (
      <section className="section">
        {header}
        {children}
      </section>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={handleOpenChange}>
      <section className="section">
        <CollapsibleTrigger asChild>{header}</CollapsibleTrigger>
        <CollapsibleContent>{children}</CollapsibleContent>
      </section>
    </Collapsible>
  );
}
