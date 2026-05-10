import { useDroppable } from '@dnd-kit/core';
import { DealCard } from './DealCard';
import { formatBRL, type DealWithRelations, type PipelineStage } from '../../types/crm.types';

interface PipelineColumnProps {
  stage: PipelineStage;
  deals: DealWithRelations[];
}

export function PipelineColumn({ stage, deals }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const totalValue = deals.reduce((sum, d) => sum + (d.estimated_value ?? 0), 0);

  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 280,
        maxWidth: 320,
        background: 'hsl(var(--ds-line-2) / 0.3)',
        border: '1px solid hsl(var(--ds-line-1))',
        boxShadow: isOver ? 'inset 0 0 0 1px hsl(var(--ds-accent))' : undefined,
        transition: 'box-shadow 0.2s, background 0.2s',
      }}
    >
      <div style={{ padding: 12, borderBottom: '1px solid hsl(var(--ds-line-1))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              flexShrink: 0,
              background: stage.color ?? 'hsl(var(--ds-accent))',
            }}
          />
          <h3
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'hsl(var(--ds-fg-1))',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {stage.name}
          </h3>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 11,
              color: 'hsl(var(--ds-fg-3))',
              background: 'hsl(var(--ds-line-2))',
              padding: '1px 8px',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {deals.length}
          </span>
        </div>
        <p
          style={{
            fontSize: 11,
            color: 'hsl(var(--ds-fg-3))',
            marginTop: 4,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatBRL(totalValue)}
        </p>
      </div>
      <div
        style={{
          flex: 1,
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 320px)',
        }}
      >
        {deals.map((deal) => (
          <div key={deal.id} data-deal-id={deal.id}>
            <DealCard deal={deal} />
          </div>
        ))}
      </div>
    </div>
  );
}
