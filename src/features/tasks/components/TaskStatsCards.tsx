import { CheckSquare, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      borderColor: 'border-l-primary',
      cardBg: 'bg-primary/5',
    },
    {
      title: 'Tarefas Urgentes',
      value: stats.urgent,
      icon: AlertCircle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-l-orange-500',
      cardBg: 'bg-orange-500/5',
    },
    {
      title: 'Tarefas Atrasadas',
      value: stats.overdue,
      icon: Clock,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      borderColor: 'border-l-destructive',
      cardBg: 'bg-destructive/5',
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
          <Card key={index} className={`border-l-4 ${stat.borderColor} ${stat.cardBg} hover:shadow-elegant transition-all duration-300 animate-fade-in`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value.toLocaleString('pt-BR')}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
