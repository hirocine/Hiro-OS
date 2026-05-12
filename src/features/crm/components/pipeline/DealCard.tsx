import { Clock, User } from 'lucide-react';
import { type DealWithRelations } from '../../types/crm.types';
import { Money } from '@/ds/components/Money';

interface DealCardProps {
  deal: DealWithRelations;
  isDragging?: boolean;
}

export function DealCard({ deal, isDragging }: DealCardProps) {
  const daysInStage = Math.floor((Date.now() - new Date(deal.updated_at ?? deal.created_at!).getTime()) / 86400000);
  const isStale = daysInStage > 7;

  return (
    <div
      style={{
        border: isStale ? '1px solid hsl(var(--ds-warning) / 0.5)' : '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isDragging ? '0 6px 20px hsl(0 0% 0% / 0.15)' : undefined,
        transition: 'opacity 0.15s, box-shadow 0.15s',
      }}
    >
      <p
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: 'hsl(var(--ds-fg-1))',
          lineHeight: 1.3,
        }}
      >
        {deal.title}
      </p>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          color: 'hsl(var(--ds-fg-3))',
        }}
      >
        <User size={11} strokeWidth={1.5} style={{ flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {deal.contact_name}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
        }}
      >
        <Money
          value={deal.estimated_value}
          style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}
        />
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontWeight: isStale ? 500 : 400,
            color: isStale ? 'hsl(var(--ds-warning))' : 'hsl(var(--ds-fg-3))',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <Clock size={11} strokeWidth={1.5} />
          {daysInStage}d
        </span>
      </div>
    </div>
  );
}
