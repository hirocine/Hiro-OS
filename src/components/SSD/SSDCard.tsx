import { Equipment } from '@/types/equipment';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SSDStatus } from '@/hooks/useSSDs';

interface SSDCardProps {
  ssd: Equipment;
  isDragging?: boolean;
  kanbanStatus?: SSDStatus;
}

const getKanbanStatusVariant = (status: SSDStatus) => {
  switch (status) {
    case 'available':
      return 'success';
    case 'in_use':
      return 'step-pickup';
    case 'loaned':
      return 'destructive';
  }
};

const getKanbanStatusLabel = (status: SSDStatus) => {
  switch (status) {
    case 'available':
      return 'Disponível';
    case 'in_use':
      return 'Em Uso';
    case 'loaned':
      return 'Emprestado';
  }
};

export const SSDCard = ({ ssd, isDragging, kanbanStatus }: SSDCardProps) => {
  const isSSD = ssd.subcategory?.toLowerCase().includes('ssd');
  const isHD = ssd.subcategory?.toLowerCase().includes('hd');
  
  return (
    <Card className={cn(
      "cursor-grab active:cursor-grabbing",
      "transition-shadow duration-200 ease-out",
      !isDragging && "hover:shadow-elegant",
      isDragging && "opacity-50",
      "motion-reduce:transition-none"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <HardDrive className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm truncate">
                  {ssd.name}
                </h4>
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {ssd.patrimonyNumber && (
                  <Badge 
                    variant="outline" 
                    className="shrink-0 text-[10px] px-1.5 py-0.5 h-5"
                  >
                    #{ssd.patrimonyNumber}
                  </Badge>
                )}
                {ssd.capacity && (
                  <Badge 
                    variant="default" 
                    className="shrink-0 text-[10px] px-1.5 py-0.5 h-5"
                  >
                    {ssd.capacity} TB
                  </Badge>
                )}
                {kanbanStatus && (
                  <Badge 
                    variant={getKanbanStatusVariant(kanbanStatus)}
                    className="shrink-0 text-[10px] px-1.5 py-0.5 h-5"
                  >
                    {getKanbanStatusLabel(kanbanStatus)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
