import { ListChecks, AlertTriangle, Flame, CheckCircle, type LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface TaskSummaryBarProps {
  stats: {
    active: number;
    overdue: number;
    urgent: number;
    completed: number;
  };
  isLoading?: boolean;
}

interface CellProps {
  Icon: LucideIcon;
  value: number;
  label: string;
  tone: string;
  active: boolean;
}

const SummaryCell = ({ Icon, value, label, tone, active }: CellProps) => {
  const color = active ? tone : 'hsl(var(--ds-fg-3))';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '4px 8px',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          display: 'grid',
          placeItems: 'center',
          background: active ? `${tone.replace(')', ' / 0.1)')}` : 'hsl(var(--ds-line-2))',
          color,
          flexShrink: 0,
        }}
      >
        <Icon size={14} strokeWidth={1.5} />
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
        <span
          style={{
            fontFamily: '"HN Display", sans-serif',
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            fontVariantNumeric: 'tabular-nums',
            color,
          }}
        >
          {value}
        </span>
        <span style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>{label}</span>
      </div>
    </div>
  );
};

export function TaskSummaryBar({ stats, isLoading }: TaskSummaryBarProps) {
  if (isLoading) {
    return (
      <div
        style={{
          border: '1px solid hsl(var(--ds-line-1))',
          background: 'hsl(var(--ds-surface))',
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-24" />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        padding: '12px 8px',
      }}
    >
      <SummaryCell
        Icon={ListChecks}
        value={stats.active}
        label="Ativas"
        tone="hsl(var(--ds-accent))"
        active
      />
      <SummaryCell
        Icon={AlertTriangle}
        value={stats.overdue}
        label="Atrasadas"
        tone="hsl(var(--ds-danger))"
        active={stats.overdue > 0}
      />
      <SummaryCell
        Icon={Flame}
        value={stats.urgent}
        label="Urgentes"
        tone="hsl(var(--ds-warning))"
        active={stats.urgent > 0}
      />
      <SummaryCell
        Icon={CheckCircle}
        value={stats.completed}
        label="Concluídas"
        tone="hsl(var(--ds-success))"
        active={stats.completed > 0}
      />
    </div>
  );
}
