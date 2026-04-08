import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { DealCard } from './DealCard';
import { formatBRL, type DealWithRelations, type PipelineStage } from '../../types/crm.types';

interface PipelineColumnProps {
  stage: PipelineStage;
  deals: DealWithRelations[];
}

export function PipelineColumn({ stage, deals }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const totalValue = deals.reduce((sum, d) => sum + (d.estimated_value ?? 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col min-w-[280px] max-w-[320px] bg-muted/30 rounded-lg border transition-all duration-200',
        isOver && 'ring-2 ring-primary/30 bg-primary/5',
      )}
    >
      <div className="p-3 border-b">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color ?? '#6366f1' }} />
          <h3 className="text-sm font-medium truncate">{stage.name}</h3>
          <span className="ml-auto text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{deals.length}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{formatBRL(totalValue)}</p>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)]">
        {deals.map(deal => (
          <div key={deal.id} data-deal-id={deal.id}>
            <DealCard deal={deal} />
          </div>
        ))}
      </div>
    </div>
  );
}
