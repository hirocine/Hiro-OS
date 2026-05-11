import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  /** Icon rendered inside the 64x64 hairline glyph. */
  icon: LucideIcon;
  /** Main message — short, HN Display. */
  title: string;
  /** Supporting description — sentence-case, max ~70ch. */
  description?: string;
  /** Primary action (e.g. "Criar primeira política"). */
  action?: ReactNode;
  /** Secondary action (e.g. "Limpar filtros"). */
  secondaryAction?: ReactNode;
  /**
   * Render style:
   * - `boxed` (default): hairline border + surface bg, used inside a page section
   * - `bare`:  no border, used when the parent already provides one (tables, cards)
   */
  variant?: 'boxed' | 'bare';
}

/**
 * Canonical empty state — horizontal layout aligned to edges.
 *
 * Replaces the legacy `.empties .empty` grid markup (centered, 360px min-height,
 * 64px padding) which looked broken outside a multi-cell grid context.
 *
 * Layout grammar:
 *   ┌────────────────────────────────────────────────────────┐
 *   │ ┌──┐  Title                              [action(s)]   │
 *   │ │ICN│  Description (max ~70ch)                          │
 *   │ └──┘                                                   │
 *   └────────────────────────────────────────────────────────┘
 *     ←icon→  ←──────── content (flex-1) ────────→  ←actions→
 *
 * Left-aligned content + right-aligned actions follow the DS rule of
 * "things align to edges", same as PageToolbar / PageHeader.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  variant = 'boxed',
}: EmptyStateProps) {
  return (
    <div
      style={{
        width: '100%',
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        ...(variant === 'boxed'
          ? {
              border: '1px solid hsl(var(--ds-line-1))',
              background: 'hsl(var(--ds-surface))',
            }
          : {}),
      }}
    >
      {/* Icon column */}
      <div
        style={{
          width: 64,
          height: 64,
          display: 'grid',
          placeItems: 'center',
          border: '1px solid hsl(var(--ds-line-2))',
          background: 'hsl(var(--ds-line-2) / 0.25)',
          color: 'hsl(var(--ds-fg-3))',
          flexShrink: 0,
        }}
      >
        <Icon size={22} strokeWidth={1.25} />
      </div>

      {/* Content column (text) */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h5
          style={{
            fontFamily: '"HN Display", sans-serif',
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            color: 'hsl(var(--ds-fg-1))',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {title}
        </h5>

        {description && (
          <p
            style={{
              fontSize: 13,
              color: 'hsl(var(--ds-fg-3))',
              lineHeight: 1.55,
              maxWidth: '70ch',
              margin: 0,
            }}
          >
            {description}
          </p>
        )}
      </div>

      {/* Actions column */}
      {(action || secondaryAction) && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}
        >
          {secondaryAction}
          {action}
        </div>
      )}
    </div>
  );
}
