import { useState } from 'react';
import { Equipment } from '@/types/equipment';
import { SSDCard } from './SSDCard';
import { SSDStatus, SSDAllocationsMap } from '@/features/ssds';
import { SSDDetailsDialog } from './SSDDetailsDialog';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface SSDKanbanBoardProps {
  ssdsByStatus: {
    available: Equipment[];
    in_use: Equipment[];
    loaned: Equipment[];
  };
  ssdAllocations: SSDAllocationsMap;
  onStatusChange: (ssdId: string, newStatus: SSDStatus) => void;
  onReorder: (ssdId: string, newStatus: SSDStatus, targetIndex: number) => void;
  onUpdate: () => void;
}

interface SortableCardProps {
  ssd: Equipment;
  kanbanStatus: SSDStatus;
  allocatedSpace: number;
  onCardClick: (ssd: Equipment) => void;
}

const SortableCard = ({ ssd, kanbanStatus, allocatedSpace, onCardClick }: SortableCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ssd.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging 
      ? 'none' 
      : 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease-out',
    pointerEvents: isDragging ? ('none' as const) : ('auto' as const),
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
"will-change-transform",
        isDragging && "opacity-0",
"transition-opacity duration-200 ease-out motion-reduce:transition-none"
      )}
      {...attributes} 
      {...listeners}
    >
      <SSDCard 
        ssd={ssd} 
        isDragging={isDragging} 
        kanbanStatus={kanbanStatus}
        allocatedSpace={allocatedSpace}
        onClick={() => onCardClick(ssd)}
      />
    </div>
  );
};

interface KanbanColumnProps {
  title: string;
  status: SSDStatus;
  ssds: Equipment[];
  count: number;
  ssdAllocations: SSDAllocationsMap;
  onCardClick: (ssd: Equipment) => void;
}

const KanbanColumn = ({ title, status, ssds, count, ssdAllocations, onCardClick }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
  });

  // Placeholder visual only; coluna é a área drop válida
  // Mantemos SortableContext apenas com IDs reais
  // (removido items)
  
  const tone =
    status === 'available' ? 'hsl(var(--ds-success))'
    : status === 'in_use' ? 'hsl(var(--ds-accent))'
    : 'hsl(var(--ds-danger))';

  return (
    <div style={{ flex: 1, minWidth: 280, overflow: 'visible' }}>
      <div
        ref={setNodeRef}
        style={{
          position: 'relative',
          background: 'hsl(var(--ds-surface))',
          border: '1px solid hsl(var(--ds-line-1))',
          padding: 14,
          overflow: 'visible',
          boxShadow: isOver ? 'inset 0 0 0 1px hsl(var(--ds-accent)), 0 4px 12px hsl(0 0% 0% / 0.06)' : undefined,
          transition: 'box-shadow 0.15s',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
            gap: 8,
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: tone }} />
            <h3
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 14,
                fontWeight: 600,
                color: 'hsl(var(--ds-fg-1))',
              }}
            >
              {title}
            </h3>
          </div>
          <span
            style={{
              fontSize: 11,
              fontVariantNumeric: 'tabular-nums',
              color: tone,
              background: `${tone.replace(')', ' / 0.1)')}`,
              padding: '2px 8px',
            }}
          >
            {count}
          </span>
        </div>
        <SortableContext items={ssds.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 200 }}>
            {ssds.length === 0 ? (
              <div
                id={`placeholder-${status}`}
                style={{
                  height: '100%',
                  minHeight: 200,
                  display: 'grid',
                  placeItems: 'center',
                  color: 'hsl(var(--ds-fg-4))',
                  fontSize: 12,
                }}
              >
                Arraste itens aqui
              </div>
            ) : (
              ssds.map((ssd) => (
                <SortableCard
                  key={ssd.id}
                  ssd={ssd}
                  kanbanStatus={status}
                  allocatedSpace={ssdAllocations[ssd.id] || 0}
                  onCardClick={onCardClick}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

export const SSDKanbanBoard = ({ ssdsByStatus, ssdAllocations, onStatusChange, onReorder, onUpdate }: SSDKanbanBoardProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedSSD, setSelectedSSD] = useState<Equipment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const hybridCollision: CollisionDetection = (args) => {
    const pointer = pointerWithin(args);
    if (pointer.length > 0) return pointer;
    const rects = rectIntersection(args);
    if (rects.length > 0) return rects;
    return closestCenter(args);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleCardClick = (ssd: Equipment) => {
    setSelectedSSD(ssd);
    setDialogOpen(true);
  };

  const handleDialogUpdate = () => {
    onUpdate();
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which column the active SSD is currently in
    let currentStatus: SSDStatus | null = null;
    if (ssdsByStatus.available.some(s => s.id === activeId)) currentStatus = 'available';
    else if (ssdsByStatus.in_use.some(s => s.id === activeId)) currentStatus = 'in_use';
    else if (ssdsByStatus.loaned.some(s => s.id === activeId)) currentStatus = 'loaned';

    if (!currentStatus) {
      return;
    }

    // Determine the target status and index
    let newStatus: SSDStatus | null = null;
    let targetIndex = -1;
    
    // Check if dropped directly on a column or placeholder
    if (overId.startsWith('column-')) {
      newStatus = overId.replace('column-', '') as SSDStatus;
      targetIndex = ssdsByStatus[newStatus].length;
    } else if (overId.startsWith('placeholder-')) {
      newStatus = overId.replace('placeholder-', '') as SSDStatus;
      targetIndex = 0;
    } else {
      // Dropped on another SSD - find which column it belongs to
      if (ssdsByStatus.available.some(s => s.id === overId)) {
        newStatus = 'available';
        targetIndex = ssdsByStatus.available.findIndex(s => s.id === overId);
      } else if (ssdsByStatus.in_use.some(s => s.id === overId)) {
        newStatus = 'in_use';
        targetIndex = ssdsByStatus.in_use.findIndex(s => s.id === overId);
      } else if (ssdsByStatus.loaned.some(s => s.id === overId)) {
        newStatus = 'loaned';
        targetIndex = ssdsByStatus.loaned.findIndex(s => s.id === overId);
      }
    }

    if (!newStatus || targetIndex < 0) {
      return;
    }

    // Handle status change (moved to different column)
    if (currentStatus !== newStatus) {
      onStatusChange(activeId, newStatus);
    } else {
      // Handle reordering within same column
      const currentIndex = ssdsByStatus[currentStatus].findIndex(s => s.id === activeId);
      if (currentIndex !== targetIndex) {
        onReorder(activeId, currentStatus, targetIndex);
      }
    }
  };

  const activeSSD = activeId
    ? [...ssdsByStatus.available, ...ssdsByStatus.in_use, ...ssdsByStatus.loaned].find(
        (ssd) => ssd.id === activeId
      )
    : null;
  
  const activeStatus: SSDStatus | undefined = activeSSD
    ? (ssdsByStatus.available.some(s => s.id === activeId) ? 'available' :
       ssdsByStatus.in_use.some(s => s.id === activeId) ? 'in_use' : 'loaned')
    : undefined;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={hybridCollision}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto overflow-y-visible pb-4 isolate">
          <KanbanColumn
            title="Livres"
            status="available"
            ssds={ssdsByStatus.available}
            count={ssdsByStatus.available.length}
            ssdAllocations={ssdAllocations}
            onCardClick={handleCardClick}
          />
          <KanbanColumn
            title="Em uso (Interno)"
            status="in_use"
            ssds={ssdsByStatus.in_use}
            count={ssdsByStatus.in_use.length}
            ssdAllocations={ssdAllocations}
            onCardClick={handleCardClick}
          />
          <KanbanColumn
            title="Em uso (Externo)"
            status="loaned"
            ssds={ssdsByStatus.loaned}
            count={ssdsByStatus.loaned.length}
            ssdAllocations={ssdAllocations}
            onCardClick={handleCardClick}
          />
        </div>
        <DragOverlay zIndex={2000}>
          {activeSSD && activeStatus ? (
            <div
              className="
                pointer-events-none z-[9999] transform-gpu
                animate-scale-in rotate-2 scale-105
                transition-all duration-200 ease-out
                motion-reduce:transition-none motion-reduce:rotate-0 motion-reduce:scale-100
"
              style={{ boxShadow: '0 16px 40px hsl(0 0% 0% / 0.25)' }}
            >
              <SSDCard 
                ssd={activeSSD} 
                isDragging={false} 
                kanbanStatus={activeStatus}
                allocatedSpace={ssdAllocations[activeSSD.id] || 0}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <SSDDetailsDialog
        ssd={selectedSSD}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdate={handleDialogUpdate}
      />
    </>
  );
};
