import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface Props {
  value: number | null;
  withContext?: boolean;
}

export function ChangeBadge({ value, withContext = true }: Props) {
  if (value === null) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 11,
          color: 'hsl(var(--ds-fg-3))',
        }}
      >
        <Minus size={11} strokeWidth={1.5} />
        Sem comparação ainda
      </span>
    );
  }
  const positive = value >= 0;
  const Icon = positive ? ArrowUp : ArrowDown;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 500,
        color: positive ? 'hsl(var(--ds-success))' : 'hsl(var(--ds-danger))',
      }}
    >
      <Icon size={11} strokeWidth={1.5} />
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.abs(value).toFixed(1)}%</span>
      {withContext && (
        <span style={{ color: 'hsl(var(--ds-fg-4))', fontWeight: 400, marginLeft: 2 }}>
          vs período anterior
        </span>
      )}
    </span>
  );
}
