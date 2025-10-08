import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Equipment } from '@/types/equipment';
import { SSDStatus } from '@/hooks/useSSDs';
import { SSDCard } from './SSDCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SSDKanbanColumnProps {
  status: SSDStatus;
  ssds: Equipment[];
  isDragging: boolean;
  onCardClick: (ssd: Equipment) => void;
}

const getStatusLabel = (status: SSDStatus) => {
  switch (status) {
    case 'available':
      return 'Livres';
    case 'in_use':
      return 'Em uso (Interno)';
    case 'loaned':
      return 'Em uso (Externo)';
  }
};

const getStatusColor = (status: SSDStatus) => {
  switch (status) {
    case 'available':
      return 'bg-success/10 text-success border-success/20';
    case 'in_use':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'loaned':
      return 'bg-destructive/10 text-destructive border-destructive/20';
  }
};

interface SortableItemProps {
  ssd: Equipment;
  status: SSDStatus;
  onCardClick: (ssd: Equipment) => void;
}

const SortableItem = ({ ssd, status, onCardClick }: SortableItemProps) => {
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
      <SSDCard
        ssd={ssd}
        isDragging={isDragging}
        kanbanStatus={status}
        onClick={() => onCardClick(ssd)}
      />
    </div>
  );
};

export const SSDKanbanColumn = ({ status, ssds, isDragging, onCardClick }: SSDKanbanColumnProps) => {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{getStatusLabel(status)}</CardTitle>
          <Badge variant="outline" className={getStatusColor(status)}>
            {ssds.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 overflow-auto">
        {ssds.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum SSD/HD nesta categoria
          </p>
        ) : (
          ssds.map((ssd) => (
            <SortableItem
              key={ssd.id}
              ssd={ssd}
              status={status}
              onCardClick={onCardClick}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};
