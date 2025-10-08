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
  const isSSD = ssd.subcategory?.toLowerCase().includes('ssd');
  const isHD = ssd.subcategory?.toLowerCase().includes('hd');
  
  return (
    <Card className={cn(
      "cursor-move will-change-transform",
      "transition-all duration-300 ease-out",
      !isDragging && "hover:shadow-elegant hover:scale-[1.02] hover:-translate-y-0.5",
      isDragging && "opacity-50",
      "motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:hover:translate-y-0"
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
                {(isSSD || isHD) && (
                  <Badge 
                    variant={isSSD ? "default" : "secondary"} 
                    className="shrink-0 text-xs"
                  >
                    {isSSD ? 'SSD' : 'HD'}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {ssd.brand}
              </p>
            </div>
          </div>
          {ssd.capacity && (
            <Badge variant="outline" className="shrink-0">
              {ssd.capacity} TB
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
