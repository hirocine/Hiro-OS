import { Equipment } from '@/types/equipment';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SSDStatus } from '@/features/ssds';

interface SSDCardProps {
  ssd: Equipment;
  isDragging?: boolean;
  kanbanStatus?: SSDStatus;
  onClick?: () => void;
  allocatedSpace?: number;
}

const getKanbanStatusVariant = (status: SSDStatus) => {
  switch (status) {
    case 'available':
      return 'success';
    case 'in_use':
      return 'warning';
    case 'loaned':
      return 'destructive';
  }
};

const getKanbanStatusLabel = (status: SSDStatus) => {
  switch (status) {
    case 'available':
      return 'Livre';
    case 'in_use':
      return 'Em uso (Interno)';
    case 'loaned':
      return 'Em uso (Externo)';
  }
};

export const SSDCard = ({ ssd, isDragging, kanbanStatus, onClick, allocatedSpace = 0 }: SSDCardProps) => {
  // Calcular espaço livre (agora vem das props)
  const freeSpace = (ssd.capacity || 0) - allocatedSpace;
  const shouldShowFreeSpace = (kanbanStatus === 'in_use' || kanbanStatus === 'loaned') && ssd.capacity;
  
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 ease-out",
        !isDragging && "hover:shadow-elegant hover:scale-[1.02]",
        isDragging && "opacity-50",
        "motion-reduce:transition-none"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 shrink-0 w-11 h-11 flex items-center justify-center">
            {ssd.ssdNumber ? (
              <span className="text-base font-bold text-primary">{ssd.ssdNumber}</span>
            ) : (
              <HardDrive className="h-6 w-6 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium line-clamp-2 mb-1.5">
              {ssd.name}
            </h4>
            <div className="flex items-center gap-1.5 flex-wrap">
              {shouldShowFreeSpace && (
                <Badge 
                  variant="outline"
                  className="shrink-0 text-[10px]"
                >
                  {allocatedSpace.toFixed(1)} / {ssd.capacity} GB
                </Badge>
              )}
              {kanbanStatus && (
                <Badge 
                  variant={getKanbanStatusVariant(kanbanStatus)}
                  className="shrink-0 text-[10px]"
                >
                  {getKanbanStatusLabel(kanbanStatus)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
