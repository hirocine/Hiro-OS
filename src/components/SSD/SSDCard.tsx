import { Equipment } from '@/types/equipment';
import { HardDrive } from 'lucide-react';
import { SSDStatus } from '@/features/ssds';

interface SSDCardProps {
  ssd: Equipment;
  isDragging?: boolean;
  kanbanStatus?: SSDStatus;
  onClick?: () => void;
  allocatedSpace?: number;
}

const statusToneStyle = (status: SSDStatus): React.CSSProperties => {
  switch (status) {
    case 'available':
      return { color: 'hsl(var(--ds-success))', borderColor: 'hsl(var(--ds-success) / 0.3)' };
    case 'in_use':
      return { color: 'hsl(var(--ds-warning))', borderColor: 'hsl(var(--ds-warning) / 0.3)' };
    case 'loaned':
      return { color: 'hsl(var(--ds-danger))', borderColor: 'hsl(var(--ds-danger) / 0.3)' };
  }
};

const getKanbanStatusLabel = (status: SSDStatus) => {
  switch (status) {
    case 'available': return 'Livre';
    case 'in_use': return 'Em uso (Interno)';
    case 'loaned': return 'Em uso (Externo)';
  }
};

export const SSDCard = ({ ssd, isDragging, kanbanStatus, onClick, allocatedSpace = 0 }: SSDCardProps) => {
  const shouldShowFreeSpace = (kanbanStatus === 'in_use' || kanbanStatus === 'loaned') && ssd.capacity;

  return (
    <div
      onClick={onClick}
      style={{
        background: 'hsl(var(--ds-surface))',
        border: '1px solid hsl(var(--ds-line-1))',
        padding: 14,
        cursor: 'pointer',
        opacity: isDragging ? 0.5 : 1,
        transition: 'opacity 0.15s, border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.borderColor = 'hsl(var(--ds-line-3))';
          e.currentTarget.style.boxShadow = '0 2px 8px hsl(0 0% 0% / 0.04)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'hsl(var(--ds-line-1))';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            display: 'grid',
            placeItems: 'center',
            background: 'hsl(var(--ds-accent) / 0.1)',
            color: 'hsl(var(--ds-accent))',
            flexShrink: 0,
          }}
        >
          {ssd.ssdNumber ? (
            <span
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 14,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {ssd.ssdNumber}
            </span>
          ) : (
            <HardDrive size={18} strokeWidth={1.5} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'hsl(var(--ds-fg-1))',
              lineHeight: 1.3,
              marginBottom: 6,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {ssd.name}
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {shouldShowFreeSpace && (
              <span className="pill muted" style={{ fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>
                {allocatedSpace.toFixed(1)} / {ssd.capacity} GB
              </span>
            )}
            {kanbanStatus && (
              <span
                className="pill"
                style={{
                  ...statusToneStyle(kanbanStatus),
                  fontSize: 10,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span className="dot" style={{ background: 'currentColor' }} />
                {getKanbanStatusLabel(kanbanStatus)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
