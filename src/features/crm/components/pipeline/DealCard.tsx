import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Clock, User } from 'lucide-react';
import { formatBRL, type DealWithRelations } from '../../types/crm.types';

interface DealCardProps {
  deal: DealWithRelations;
  isDragging?: boolean;
}

export function DealCard({ deal, isDragging }: DealCardProps) {
  const daysInStage = Math.floor((Date.now() - new Date(deal.updated_at ?? deal.created_at!).getTime()) / 86400000);
  const isStale = daysInStage > 7;

  return (
    <Card className={cn(
      'cursor-grab active:cursor-grabbing transition-all duration-150',
      isDragging && 'opacity-50 shadow-lg',
      isStale && 'border-orange-400 border-2',
    )}>
      <CardContent className="p-3 space-y-2">
        <p className="text-sm font-medium leading-tight">{deal.title}</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span className="truncate">{deal.contact_name}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">{formatBRL(deal.estimated_value)}</span>
          <span className={cn('flex items-center gap-1', isStale ? 'text-orange-500 font-medium' : 'text-muted-foreground')}>
            <Clock className="h-3 w-3" />
            {daysInStage}d
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
