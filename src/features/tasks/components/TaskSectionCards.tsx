import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckSquare, ArrowRight, ListChecks, AlertTriangle, Flame } from 'lucide-react';
import { useTaskSectionStats } from '../hooks/useTaskSectionStats';

interface StatItemProps {
  value: number;
  label: string;
  colorClass?: string;
}

function StatItem({ value, label, colorClass = 'text-muted-foreground' }: StatItemProps) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export function TaskSectionCards() {
  const { stats, isLoading } = useTaskSectionStats();

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-10 w-10 rounded-xl mb-4" />
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="h-9 w-full" />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <CheckSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Minhas Tarefas</h3>
          </div>
          <Link to="/tarefas">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-muted">
              Ver Tarefas
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 py-4 px-2 bg-muted/30 rounded-lg">
          <div className="flex flex-col items-center gap-1">
            <ListChecks className="h-4 w-4 text-muted-foreground" />
            <StatItem value={stats.active} label="Ativas" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <StatItem 
              value={stats.overdue} 
              label="Atrasadas" 
              colorClass={stats.overdue > 0 ? 'text-destructive' : 'text-muted-foreground'}
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <Flame className="h-4 w-4 text-orange-500" />
            <StatItem 
              value={stats.urgent} 
              label="Urgentes" 
              colorClass={stats.urgent > 0 ? 'text-orange-500' : 'text-muted-foreground'}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
