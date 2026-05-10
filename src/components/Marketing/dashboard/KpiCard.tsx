import { ChangeBadge } from './ChangeBadge';

interface Props {
  label: string;
  value: string | number;
  change: number | null;
  emoji: string;
}

export function KpiCard({ label, value, change, emoji }: Props) {
  return (
    <div
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          color: 'hsl(var(--ds-fg-3))',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontWeight: 500,
        }}
      >
        <span style={{ fontSize: 13 }}>{emoji}</span>
        <span>{label}</span>
      </div>
      <div
        style={{
          fontFamily: '"HN Display", sans-serif',
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          fontVariantNumeric: 'tabular-nums',
          color: 'hsl(var(--ds-fg-1))',
          lineHeight: 1.05,
          marginTop: 4,
        }}
      >
        {value}
      </div>
      <div style={{ marginTop: 2 }}>
        <ChangeBadge value={change} />
      </div>
    </div>
  );
}
