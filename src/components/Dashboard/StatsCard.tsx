import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <div
      className={className}
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 500,
            color: 'hsl(var(--ds-fg-3))',
          }}
        >
          {title}
        </span>
        <Icon size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
      </div>
      <div
        style={{
          fontFamily: '"HN Display", sans-serif',
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          fontVariantNumeric: 'tabular-nums',
          color: 'hsl(var(--ds-fg-1))',
        }}
      >
        {value}
      </div>
      {trend && (
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: trend.isPositive ? 'hsl(var(--ds-success))' : 'hsl(var(--ds-danger))',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {trend.isPositive ? (
            <TrendingUp size={11} strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <TrendingDown size={11} strokeWidth={1.5} aria-hidden="true" />
          )}
          {trend.isPositive ? '+' : ''}
          {trend.value} vs. mês anterior
        </p>
      )}
    </div>
  );
}
