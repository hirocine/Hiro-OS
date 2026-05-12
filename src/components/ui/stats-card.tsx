import { LucideIcon } from 'lucide-react';
import { CountUp } from '@/ds/components/CountUp';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  /** Tailwind color class — mapped to DS tone via heuristic (legacy support) */
  color?: string;
  /** Legacy bg class — ignored, DS uses hairline */
  bgColor?: string;
  description?: string;
  /**
   * Disable the count-up animation for the big number. Useful when the
   * card flips frequently (e.g. real-time data) or when you want a
   * static read. Strings always render as-is.
   */
  noAnimate?: boolean;
}

const toneFor = (color?: string): string => {
  if (!color) return 'hsl(var(--ds-fg-1))';
  if (color.includes('success')) return 'hsl(var(--ds-success))';
  if (color.includes('destructive') || color.includes('danger')) return 'hsl(var(--ds-danger))';
  if (color.includes('warning')) return 'hsl(var(--ds-warning))';
  if (color.includes('primary')) return 'hsl(var(--ds-accent))';
  if (color.includes('info')) return 'hsl(var(--ds-info))';
  if (color.includes('muted')) return 'hsl(var(--ds-fg-3))';
  return 'hsl(var(--ds-fg-1))';
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  description,
  noAnimate,
}: StatsCardProps) {
  const tone = toneFor(color);
  return (
    <div
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          display: 'grid',
          placeItems: 'center',
          border: '1px solid hsl(var(--ds-line-1))',
          color: tone,
          flexShrink: 0,
        }}
      >
        <Icon size={16} strokeWidth={1.5} />
      </div>
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
        <span
          style={{
            fontFamily: '"HN Display", sans-serif',
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            lineHeight: 1.05,
            fontVariantNumeric: 'tabular-nums',
            color: tone,
          }}
        >
          {typeof value === 'number' ? <CountUp value={value} disabled={noAnimate} /> : value}
        </span>
        {description && (
          <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))', marginTop: 2, lineHeight: 1.3 }}>
            {description}
          </span>
        )}
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        minHeight: 86,
      }}
    >
      <span className="sk dot" style={{ width: 36, height: 36, flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <span className="sk line" style={{ width: '40%' }} />
        <span className="sk line lg" style={{ width: '30%' }} />
      </div>
    </div>
  );
}

interface StatsCardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
}

export function StatsCardGrid({ children, columns = 3 }: StatsCardGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}
