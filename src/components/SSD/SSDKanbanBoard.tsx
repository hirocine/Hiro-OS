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
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SSDKanbanBoardProps {
  ssdsByStatus: {
    available: Equipment[];
    in_use: Equipment[];
    loaned: Equipment[];
  };
  onStatusChange: (ssdId: string, newStatus: SSDStatus) => void;
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
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
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

  return (
    <div className="flex-1 min-w-[280px]">
      <div 
        ref={setNodeRef}
        className={`bg-muted/50 rounded-lg p-4 transition-colors ${
          isOver ? 'bg-primary/10 ring-2 ring-primary' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">{title}</h3>
          <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
            {count}
          </span>
        </div>
        <SortableContext items={ssds.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 min-h-[200px]">
            {ssds.map((ssd) => (
              <SortableCard key={ssd.id} ssd={ssd} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

export const SSDKanbanBoard = ({ ssdsByStatus, onStatusChange }: SSDKanbanBoardProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Determinar o novo status baseado na coluna de destino
    let newStatus: SSDStatus | null = null;
    
    // Verificar se foi solto diretamente sobre uma coluna
    if (overId.startsWith('column-')) {
      newStatus = overId.replace('column-', '') as SSDStatus;
    } else {
      // Foi solto sobre outro SSD, determinar a coluna pela posição do SSD
      if (ssdsByStatus.available.some(s => s.id === overId)) {
        newStatus = 'available';
      } else if (ssdsByStatus.in_use.some(s => s.id === overId)) {
        newStatus = 'in_use';
      } else if (ssdsByStatus.loaned.some(s => s.id === overId)) {
        newStatus = 'loaned';
      }
    }

    if (newStatus) {
      onStatusChange(activeId, newStatus);
    }

    setActiveId(null);
  };

  const activeSSD = activeId
    ? [...ssdsByStatus.available, ...ssdsByStatus.in_use, ...ssdsByStatus.loaned].find(
        (ssd) => ssd.id === activeId
      )
    : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
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
      <DragOverlay>
        {activeSSD ? <SSDCard ssd={activeSSD} /> : null}
      </DragOverlay>
    </DndContext>
  );
};
