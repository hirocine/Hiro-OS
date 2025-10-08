import { Equipment } from '@/types/equipment';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SSDCardProps {
  ssd: Equipment;
  isDragging?: boolean;
}

export const SSDCard = ({ ssd, isDragging }: SSDCardProps) => {
  return (
    <Card className={cn(
      "cursor-move transition-all hover:shadow-md",
      isDragging && "opacity-50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <HardDrive className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">
                {ssd.name}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                {ssd.brand}
              </p>
            </div>
          </div>
          {ssd.capacity && (
            <Badge variant="secondary" className="shrink-0">
              {ssd.capacity} TB
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
