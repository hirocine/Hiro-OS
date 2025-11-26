import { CheckSquare, AlertCircle, Clock } from 'lucide-react';
import { StatsCard } from '@/components/Dashboard/StatsCard';
import { useTaskStats } from '../hooks/useTaskStats';
import { Skeleton } from '@/components/ui/skeleton';

export function TaskStatsCards() {
  const { stats, isLoading } = useTaskStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatsCard
        title="Tarefas Ativas"
        value={stats.active}
        icon={CheckSquare}
      />
      <StatsCard
        title="Tarefas Urgentes"
        value={stats.urgent}
        icon={AlertCircle}
      />
      <StatsCard
        title="Tarefas Atrasadas"
        value={stats.overdue}
        icon={Clock}
      />
    </div>
  );
}
