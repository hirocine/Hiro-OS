import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PPPriorityBadge } from './PPPriorityBadge';
import { usePostProductionMutations } from '../hooks/usePostProductionMutations';
import { PostProductionItem, PPStatus, PP_STATUS_CONFIG, PP_STATUS_COLUMNS } from '../types';
import { cn } from '@/lib/utils';
import { Calendar, User } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';

interface PPKanbanProps {
  items: PostProductionItem[];
  onItemClick?: (item: PostProductionItem) => void;
}

function KanbanCard({ item, onItemClick, isOverlay }: { item: PostProductionItem; onItemClick?: (item: PostProductionItem) => void; isOverlay?: boolean }) {
  const isOverdue = item.due_date && item.status !== 'entregue' && new Date(item.due_date + 'T00:00:00') < new Date();

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow",
        isOverdue && "border-destructive/50",
        isOverlay && "shadow-2xl rotate-2"
      )}
      onClick={() => onItemClick?.(item)}
    >
      <CardContent className="p-3 space-y-2">
        <p className="text-sm font-medium line-clamp-2">{item.title}</p>
        {(item.project_name || item.client_name) && (
          <p className="text-xs text-muted-foreground truncate">{item.project_name || item.client_name}</p>
        )}
        <div className="flex items-center justify-between gap-2">
          <PPPriorityBadge priority={item.priority} />
          {item.due_date && (
            <span className={cn("text-xs flex items-center gap-1", isOverdue ? "text-destructive font-medium" : "text-muted-foreground")}>
              <Calendar className="h-3 w-3" />
              {new Date(item.due_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </span>
          )}
        </div>
        {item.editor_name && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="truncate">{item.editor_name}</span>
          </div>
        )}
      </CardContent>
    </Card>
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
      className={cn(
        "transition-all duration-200",
        isDragging ? "opacity-50 scale-95 cursor-grabbing" : "cursor-grab"
      )}
    >
      <KanbanCard item={item} onItemClick={isDragging ? undefined : onItemClick} />
    </div>
  );
}

function DroppableColumn({ status, children }: { status: PPStatus; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = PP_STATUS_CONFIG[status];

  return (
    <div className="flex-1 min-w-[260px]">
      <div
        ref={setNodeRef}
        className={cn(
          "bg-muted/50 rounded-lg p-4 transition-all duration-200",
          isOver && "ring-2 ring-primary/30 bg-primary/5"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn("font-semibold text-sm", config.color)}>{config.label}</h3>
          <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
            {(children as any)?.length ?? 0}
          </span>
        </div>
        <div className="space-y-2 min-h-[200px]">
          {children}
        </div>
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
    items.forEach(item => {
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
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PP_STATUS_COLUMNS.map(status => {
          const columnItems = itemsByStatus[status];
          return (
            <DroppableColumn key={status} status={status}>
              {columnItems.length === 0 ? (
                <div className="h-full min-h-[200px] flex items-center justify-center text-muted-foreground/50 text-sm">
                  Nenhum vídeo
                </div>
              ) : (
                columnItems.map(item => (
                  <DraggableCard key={item.id} item={item} onItemClick={onItemClick} />
                ))
              )}
            </DroppableColumn>
          );
        })}
      </div>
      <DragOverlay>
        {activeItem ? <KanbanCard item={activeItem} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
