import { useMemo, useState } from 'react';
import { PPPriorityBadge } from './PPPriorityBadge';
import { usePostProductionMutations } from '../hooks/usePostProductionMutations';
import { PostProductionItem, PPStatus, PP_STATUS_CONFIG, PP_STATUS_COLUMNS } from '../types';
import { Calendar, User } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';

interface PPKanbanProps {
  items: PostProductionItem[];
  onItemClick?: (item: PostProductionItem) => void;
}

const statusToneColor = (status: PPStatus): string => {
  switch (status) {
    case 'entregue': return 'hsl(var(--ds-success))';
    case 'edicao': return 'hsl(var(--ds-info))';
    case 'color_grading': return 'hsl(280 70% 60%)';
    case 'finalizacao': return 'hsl(var(--ds-warning))';
    case 'revisao': return 'hsl(var(--ds-warning))';
    case 'validacao_cliente': return 'hsl(var(--ds-info))';
    default: return 'hsl(var(--ds-fg-3))';
  }
};

function KanbanCard({ item, onItemClick, isOverlay }: { item: PostProductionItem; onItemClick?: (item: PostProductionItem) => void; isOverlay?: boolean }) {
  const isOverdue =
    item.due_date && item.status !== 'entregue' && new Date(item.due_date + 'T00:00:00') < new Date();

  return (
    <div
      onClick={() => onItemClick?.(item)}
      style={{
        background: 'hsl(var(--ds-surface))',
        border: isOverdue ? '1px solid hsl(var(--ds-danger) / 0.5)' : '1px solid hsl(var(--ds-line-1))',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        cursor: 'pointer',
        boxShadow: isOverlay ? '0 8px 24px hsl(0 0% 0% / 0.2)' : undefined,
        transform: isOverlay ? 'rotate(2deg)' : undefined,
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      <p
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: 'hsl(var(--ds-fg-1))',
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {item.title}
      </p>
      {(item.project_name || item.client_name) && (
        <p
          style={{
            fontSize: 11,
            color: 'hsl(var(--ds-fg-3))',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.project_name || item.client_name}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <PPPriorityBadge priority={item.priority} />
        {item.due_date && (
          <span
            style={{
              fontSize: 11,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontVariantNumeric: 'tabular-nums',
              fontWeight: isOverdue ? 500 : 400,
              color: isOverdue ? 'hsl(var(--ds-danger))' : 'hsl(var(--ds-fg-3))',
            }}
          >
            <Calendar size={11} strokeWidth={1.5} />
            {new Date(item.due_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </span>
        )}
      </div>
      {item.editor_name && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
          <User size={11} strokeWidth={1.5} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.editor_name}
          </span>
        </div>
      )}
    </div>
  );
}

function DraggableCard({ item, onItemClick }: { item: PostProductionItem; onItemClick?: (item: PostProductionItem) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'scale(0.95)' : undefined,
        transition: 'opacity 0.15s, transform 0.15s',
      }}
    >
      <KanbanCard item={item} onItemClick={isDragging ? undefined : onItemClick} />
    </div>
  );
}

function DroppableColumn({ status, count, children }: { status: PPStatus; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = PP_STATUS_CONFIG[status];
  const tone = statusToneColor(status);

  return (
    <div style={{ flex: 1, minWidth: 260 }}>
      <div
        ref={setNodeRef}
        style={{
          background: 'hsl(var(--ds-surface))',
          border: '1px solid hsl(var(--ds-line-1))',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          boxShadow: isOver ? 'inset 0 0 0 1px hsl(var(--ds-accent))' : undefined,
          transition: 'box-shadow 0.15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: tone }} />
            <h3
              style={{
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 500,
                color: 'hsl(var(--ds-fg-2))',
              }}
            >
              {config.label}
            </h3>
          </div>
          <span
            style={{
              fontSize: 11,
              color: 'hsl(var(--ds-fg-3))',
              background: 'hsl(var(--ds-line-2))',
              padding: '0 6px',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {count}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 200 }}>{children}</div>
      </div>
    </div>
  );
}

export function PPKanban({ items, onItemClick }: PPKanbanProps) {
  const { updateItem } = usePostProductionMutations();
  const [activeItem, setActiveItem] = useState<PostProductionItem | null>(null);

  const itemsByStatus = useMemo(() => {
    const map: Record<PPStatus, PostProductionItem[]> = {
      fila: [], edicao: [], color_grading: [], finalizacao: [], revisao: [], validacao_cliente: [], entregue: [],
    };
    items.forEach((item) => {
      if (map[item.status]) map[item.status].push(item);
    });
    return map;
  }, [items]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveItem(event.active.data.current?.item ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const item = active.data.current?.item as PostProductionItem | undefined;
    const newStatus = over.id as PPStatus;

    if (item && newStatus !== item.status && PP_STATUS_COLUMNS.includes(newStatus)) {
      updateItem.mutate({ id: item.id, updates: { status: newStatus } });
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16 }}>
        {PP_STATUS_COLUMNS.map((status) => {
          const columnItems = itemsByStatus[status];
          return (
            <DroppableColumn key={status} status={status} count={columnItems.length}>
              {columnItems.length === 0 ? (
                <div
                  style={{
                    height: '100%',
                    minHeight: 200,
                    display: 'grid',
                    placeItems: 'center',
                    color: 'hsl(var(--ds-fg-4))',
                    fontSize: 12,
                  }}
                >
                  Nenhum vídeo
                </div>
              ) : (
                columnItems.map((item) => (
                  <DraggableCard key={item.id} item={item} onItemClick={onItemClick} />
                ))
              )}
            </DroppableColumn>
          );
        })}
      </div>
      <DragOverlay>{activeItem ? <KanbanCard item={activeItem} isOverlay /> : null}</DragOverlay>
    </DndContext>
  );
}
