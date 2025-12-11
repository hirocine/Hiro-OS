import { ListChecks, AlertTriangle, Flame } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface TaskSummaryBarProps {
  stats: {
    active: number;
    overdue: number;
    urgent: number;
  };
  isLoading?: boolean;
  variant?: 'general' | 'private';
}

export function TaskSummaryBar({ stats, isLoading, variant = 'general' }: TaskSummaryBarProps) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center gap-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-24" />
          ))}
        </div>
      </Card>
    );
  }

  const borderColor = variant === 'private' ? 'border-l-purple-500' : 'border-l-primary';

  return (
    <Card className={cn("border-l-4", borderColor)}>
      <div className="flex items-center justify-center gap-6 md:gap-12 py-3 px-4">
        {/* Ativas */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <ListChecks className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-primary">{stats.active}</span>
            <span className="text-sm text-muted-foreground">Ativas</span>
          </div>
        </div>

        <div className="h-8 w-px bg-border" />

        {/* Atrasadas */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1.5 rounded-lg",
            stats.overdue > 0 ? "bg-destructive/10" : "bg-muted"
          )}>
            <AlertTriangle className={cn(
              "h-4 w-4",
              stats.overdue > 0 ? "text-destructive" : "text-muted-foreground"
            )} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={cn(
              "text-xl font-bold",
              stats.overdue > 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {stats.overdue}
            </span>
            <span className="text-sm text-muted-foreground">Atrasadas</span>
          </div>
        </div>

        <div className="h-8 w-px bg-border" />

        {/* Urgentes */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1.5 rounded-lg",
            stats.urgent > 0 ? "bg-orange-500/10" : "bg-muted"
          )}>
            <Flame className={cn(
              "h-4 w-4",
              stats.urgent > 0 ? "text-orange-500" : "text-muted-foreground"
            )} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={cn(
              "text-xl font-bold",
              stats.urgent > 0 ? "text-orange-500" : "text-muted-foreground"
            )}>
              {stats.urgent}
            </span>
            <span className="text-sm text-muted-foreground">Urgentes</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
