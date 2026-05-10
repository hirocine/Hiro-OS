import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  subtone?: 'muted' | 'positive' | 'negative';
}

const subtoneColor: Record<NonNullable<Props['subtone']>, string> = {
  muted: 'hsl(var(--ds-fg-3))',
  positive: 'hsl(var(--ds-success))',
  negative: 'hsl(var(--ds-danger))',
};

export function AccountKpiCard({ icon: Icon, label, value, subtitle, subtone = 'muted' }: Props) {
  return (
    <div
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          color: 'hsl(var(--ds-fg-3))',
        }}
      >
        <Icon size={13} strokeWidth={1.5} />
        <span
          style={{
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontFamily: '"HN Display", sans-serif',
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          fontVariantNumeric: 'tabular-nums',
          color: 'hsl(var(--ds-fg-1))',
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
      {subtitle && (
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: subtoneColor[subtone],
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
