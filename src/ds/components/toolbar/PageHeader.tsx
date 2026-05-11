import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Right-side action(s). Canonically one `.btn primary`. */
  action?: ReactNode;
  /** Optional small status text shown beside subtitle (e.g. "atualizado há instantes"). */
  meta?: ReactNode;
}

/**
 * Canonical page header (slot 01).
 *
 * Layout:
 *   ┌─────────────────────────────────────────────┐
 *   │ Title.                              [action] │
 *   │ Subtitle  meta                                │
 *   └─────────────────────────────────────────────┘
 *
 * Title always ends with a period and uses HN Display.
 */
export function PageHeader({ title, subtitle, action, meta }: PageHeaderProps) {
  return (
    <div className="ph">
      <div>
        <h1 className="ph-title">{title}</h1>
        {(subtitle || meta) && (
          <p className="ph-sub" style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            {subtitle}
            {meta && (
              <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))' }}>{meta}</span>
            )}
          </p>
        )}
      </div>
      {action && <div className="ph-actions">{action}</div>}
    </div>
  );
}
