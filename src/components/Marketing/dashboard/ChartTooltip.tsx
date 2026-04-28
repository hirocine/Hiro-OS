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
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-1">{labelStr}</p>
      <p className="text-primary font-medium font-numeric">
        {val.toLocaleString('pt-BR')} {unit}
      </p>
    </div>
  );
}
