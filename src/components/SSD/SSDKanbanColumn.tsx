import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Equipment } from '@/types/equipment';
import { SSDStatus } from '@/features/ssds';
import { SSDCard } from './SSDCard';

interface SSDKanbanColumnProps {
  status: SSDStatus;
  ssds: Equipment[];
  isDragging: boolean;
  onCardClick: (ssd: Equipment) => void;
}

const getStatusLabel = (status: SSDStatus) => {
  switch (status) {
    case 'available': return 'Livres';
    case 'in_use': return 'Em uso (Interno)';
    case 'loaned': return 'Em uso (Externo)';
  }
};

const statusTone = (status: SSDStatus): { color: string } => {
  switch (status) {
    case 'available': return { color: 'hsl(var(--ds-success))' };
    case 'in_use': return { color: 'hsl(var(--ds-accent))' };
    case 'loaned': return { color: 'hsl(var(--ds-danger))' };
  }
};

interface SortableItemProps {
  ssd: Equipment;
  status: SSDStatus;
  onCardClick: (ssd: Equipment) => void;
}

const SortableItem = ({ ssd, status, onCardClick }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ssd.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SSDCard ssd={ssd} isDragging={isDragging} kanbanStatus={status} onClick={() => onCardClick(ssd)} />
    </div>
  );
};

export const SSDKanbanColumn = ({ status, ssds, onCardClick }: SSDKanbanColumnProps) => {
  const tone = statusTone(status);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'hsl(var(--ds-surface))',
        border: '1px solid hsl(var(--ds-line-1))',
      }}
    >
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid hsl(var(--ds-line-1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: tone.color }} />
          <span
            style={{
              fontFamily: '"HN Display", sans-serif',
              fontSize: 14,
              fontWeight: 600,
              color: 'hsl(var(--ds-fg-1))',
            }}
          >
            {getStatusLabel(status)}
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            fontVariantNumeric: 'tabular-nums',
            color: tone.color,
            background: `${tone.color.replace(')', ' / 0.1)')}`,
            padding: '2px 8px',
          }}
        >
          {ssds.length}
        </span>
      </div>
      <div
        style={{
          flex: 1,
          padding: 12,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {ssds.length === 0 ? (
          <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', textAlign: 'center', padding: '32px 0' }}>
            Nenhum SSD/HD nesta categoria
          </p>
        ) : (
          ssds.map((ssd) => (
            <SortableItem key={ssd.id} ssd={ssd} status={status} onCardClick={onCardClick} />
          ))
        )}
      </div>
    </div>
  );
};
