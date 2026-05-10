interface Props {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  unit: string;
}

export function ChartTooltip({ active, payload, label, unit }: Props) {
  if (!active || !payload?.length) return null;
  const val = Number(payload[0]?.value ?? 0);
  const labelStr = label
    ? new Date(String(label) + 'T12:00:00').toLocaleDateString('pt-BR')
    : '';
  return (
    <div
      style={{
        background: 'hsl(var(--ds-surface))',
        border: '1px solid hsl(var(--ds-line-1))',
        padding: 12,
        fontSize: 12,
        fontFamily: '"HN Text", sans-serif',
      }}
    >
      <div style={{ fontWeight: 600, color: 'hsl(var(--ds-fg-1))', marginBottom: 4 }}>
        {labelStr}
      </div>
      <div
        style={{
          color: 'hsl(var(--ds-accent))',
          fontWeight: 500,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {val.toLocaleString('pt-BR')} {unit}
      </div>
    </div>
  );
}
