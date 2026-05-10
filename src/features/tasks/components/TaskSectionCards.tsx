import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckSquare, ArrowRight, ListChecks, AlertTriangle, Flame, type LucideIcon } from 'lucide-react';
import { useTaskSectionStats } from '../hooks/useTaskSectionStats';

interface StatItemProps {
  Icon: LucideIcon;
  value: number;
  label: string;
  tone: string;
  active: boolean;
}

const StatItem = ({ Icon, value, label, tone, active }: StatItemProps) => {
  const color = active ? tone : 'hsl(var(--ds-fg-3))';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '8px 4px',
      }}
    >
      <Icon size={14} strokeWidth={1.5} style={{ color }} />
      <span
        style={{
          fontFamily: '"HN Display", sans-serif',
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.05,
          color,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontWeight: 500,
          color: 'hsl(var(--ds-fg-3))',
        }}
      >
        {label}
      </span>
    </div>
  );
};

export function TaskSectionCards() {
  const { stats, isLoading } = useTaskSectionStats();

  if (isLoading) {
    return (
      <div
        style={{
          border: '1px solid hsl(var(--ds-line-1))',
          background: 'hsl(var(--ds-surface))',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-6 w-32" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '20px 24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 18,
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                display: 'grid',
                placeItems: 'center',
                background: 'hsl(var(--ds-accent) / 0.1)',
                color: 'hsl(var(--ds-accent))',
              }}
            >
              <CheckSquare size={18} strokeWidth={1.5} />
            </div>
            <h3
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 16,
                fontWeight: 600,
                color: 'hsl(var(--ds-fg-1))',
              }}
            >
              Minhas Tarefas
            </h3>
          </div>
          <Link
            to="/tarefas"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              color: 'hsl(var(--ds-accent))',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <span>Ver Tarefas</span>
            <ArrowRight size={13} strokeWidth={1.5} />
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            background: 'hsl(var(--ds-line-2) / 0.3)',
            border: '1px solid hsl(var(--ds-line-2))',
          }}
        >
          <StatItem
            Icon={ListChecks}
            value={stats.active}
            label="Ativas"
            tone="hsl(var(--ds-accent))"
            active
          />
          <StatItem
            Icon={AlertTriangle}
            value={stats.overdue}
            label="Atrasadas"
            tone="hsl(var(--ds-danger))"
            active={stats.overdue > 0}
          />
          <StatItem
            Icon={Flame}
            value={stats.urgent}
            label="Urgentes"
            tone="hsl(var(--ds-warning))"
            active={stats.urgent > 0}
          />
        </div>
      </div>
    </div>
  );
}
