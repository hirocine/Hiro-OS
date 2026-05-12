/**
 * Internal shared bits for the /administracao sub-pages.
 *
 * Kept private to `src/pages/admin/*` — the rest of the app should
 * not reach in here. If something here grows useful outside this
 * directory, promote it to `src/ds/components/`.
 */
import type { LucideIcon } from 'lucide-react';

export const HN_DISPLAY: React.CSSProperties = { fontFamily: '"HN Display", sans-serif' };

export const eyebrowLabelStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

interface SectionShellProps {
  icon?: LucideIcon;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  bodyPadding?: number | string;
}

/** Bordered DS section with an eyebrow header and optional action slot. */
export function SectionShell({
  icon: Icon,
  title,
  actions,
  children,
  bodyPadding = 18,
}: SectionShellProps) {
  return (
    <div
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
      }}
    >
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid hsl(var(--ds-line-1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {Icon && <Icon size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />}
          <span
            style={{
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 500,
              color: 'hsl(var(--ds-fg-2))',
            }}
          >
            {title}
          </span>
        </div>
        {actions}
      </div>
      <div style={{ padding: bodyPadding }}>{children}</div>
    </div>
  );
}

/**
 * Standard page-header used at the top of every admin sub-page.
 * Title + subtitle on the left; optional action button(s) on the right.
 */
export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="ph">
      <div>
        <h1 className="ph-title">{title}.</h1>
        <p className="ph-sub">{subtitle}</p>
      </div>
      {actions && <div className="ph-actions">{actions}</div>}
    </div>
  );
}
