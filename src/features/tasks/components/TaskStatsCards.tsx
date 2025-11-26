import { CheckSquare, AlertCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useTaskStats } from '../hooks/useTaskStats';
import { Skeleton } from '@/components/ui/skeleton';

export function TaskStatsCards() {
  const { stats, isLoading } = useTaskStats();

  const statsCards = [
    {
      title: 'Tarefas Ativas',
      value: stats.active,
      icon: CheckSquare,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Tarefas Urgentes',
      value: stats.urgent,
      icon: AlertCircle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Tarefas Atrasadas',
      value: stats.overdue,
      icon: Clock,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

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
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">
                {stat.title}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stat.value.toLocaleString('pt-BR')}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
