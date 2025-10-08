import { useState } from 'react';
import { Equipment } from '@/types/equipment';
import { SSDCard } from './SSDCard';
import { SSDStatus } from '@/hooks/useSSDs';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
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
  onStatusChange: (ssdId: string, newStatus: SSDStatus) => void;
  onReorder: (ssdId: string, newStatus: SSDStatus, targetIndex: number) => void;
}

interface SortableCardProps {
  ssd: Equipment;
}

const SortableCard = ({ ssd }: SortableCardProps) => {
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
      <SSDCard ssd={ssd} isDragging={isDragging} />
    </div>
  );
};

interface KanbanColumnProps {
  title: string;
  status: SSDStatus;
  ssds: Equipment[];
  count: number;
}

const KanbanColumn = ({ title, status, ssds, count }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
  });

  // Placeholder visual only; coluna é a área drop válida
  // Mantemos SortableContext apenas com IDs reais
  // (removido items)
  
  return (
    <div className="flex-1 min-w-[280px] overflow-visible">
      <div 
        ref={setNodeRef}
        className={cn(
          "relative z-0 bg-muted/50 rounded-lg p-4 overflow-visible",
          "transition-all duration-300 ease-in-out motion-reduce:transition-none",
          "will-change-transform",
          isOver && 'bg-primary/10 scale-[1.01] shadow-md'
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn(
            "font-semibold text-sm",
            status === 'available' && "text-green-600 dark:text-green-400",
            status === 'in_use' && "text-orange-600 dark:text-orange-400",
            status === 'loaned' && "text-red-600 dark:text-red-400"
          )}>{title}</h3>
          <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
            {count}
          </span>
        </div>
        <SortableContext items={ssds.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 min-h-[200px]">
            {ssds.length === 0 ? (
              <div 
                id={`placeholder-${status}`}
                className="h-full min-h-[200px] flex items-center justify-center text-muted-foreground/50 text-sm"
              >
                Arraste itens aqui
              </div>
            ) : (
              ssds.map((ssd) => (
                <SortableCard key={ssd.id} ssd={ssd} />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

export const SSDKanbanBoard = ({ ssdsByStatus, onStatusChange, onReorder }: SSDKanbanBoardProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    console.log('🎯 Drag ended:', { activeId, overId });

    // Find which column the active SSD is currently in
    let currentStatus: SSDStatus | null = null;
    if (ssdsByStatus.available.some(s => s.id === activeId)) currentStatus = 'available';
    else if (ssdsByStatus.in_use.some(s => s.id === activeId)) currentStatus = 'in_use';
    else if (ssdsByStatus.loaned.some(s => s.id === activeId)) currentStatus = 'loaned';

    if (!currentStatus) {
      console.log('❌ Dragged SSD not found in any column');
      return;
    }

    console.log('📍 Current status:', currentStatus);

    // Determine the target status and index
    let newStatus: SSDStatus | null = null;
    let targetIndex = -1;
    
    // Check if dropped directly on a column or placeholder
    if (overId.startsWith('column-')) {
      newStatus = overId.replace('column-', '') as SSDStatus;
      targetIndex = ssdsByStatus[newStatus].length;
      console.log('🎯 Dropped on column header:', { newStatus, targetIndex });
    } else if (overId.startsWith('placeholder-')) {
      newStatus = overId.replace('placeholder-', '') as SSDStatus;
      targetIndex = 0;
      console.log('🎯 Dropped on placeholder:', { newStatus, targetIndex });
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
      console.log('🎯 Dropped on SSD:', { newStatus, targetIndex });
    }

    if (!newStatus || targetIndex < 0) {
      console.log('❌ Could not determine target column');
      return;
    }

    // Handle status change (moved to different column)
    if (currentStatus !== newStatus) {
      console.log('✅ Status change detected:', { from: currentStatus, to: newStatus });
      onStatusChange(activeId, newStatus);
    } else {
      // Handle reordering within same column
      const currentIndex = ssdsByStatus[currentStatus].findIndex(s => s.id === activeId);
      if (currentIndex !== targetIndex) {
        console.log('✅ Reordering in same column:', { from: currentIndex, to: targetIndex });
        onReorder(activeId, currentStatus, targetIndex);
      } else {
        console.log('ℹ️ No change needed');
      }
    }
  };

  const activeSSD = activeId
    ? [...ssdsByStatus.available, ...ssdsByStatus.in_use, ...ssdsByStatus.loaned].find(
        (ssd) => ssd.id === activeId
      )
    : null;

  return (
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
        />
        <KanbanColumn
          title="Em Uso"
          status="in_use"
          ssds={ssdsByStatus.in_use}
          count={ssdsByStatus.in_use.length}
        />
        <KanbanColumn
          title="Emprestado"
          status="loaned"
          ssds={ssdsByStatus.loaned}
          count={ssdsByStatus.loaned.length}
        />
      </div>
      <DragOverlay zIndex={2000}>
        {activeSSD ? (
          <div className="
            shadow-elegant pointer-events-none z-[9999] transform-gpu
            animate-scale-in rotate-2 scale-105
            transition-all duration-200 ease-out
            motion-reduce:transition-none motion-reduce:rotate-0 motion-reduce:scale-100
          ">
            <SSDCard ssd={activeSSD} isDragging={false} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
