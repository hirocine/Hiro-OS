import { Film, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AVProjectStats } from '../types';

interface AVProjectStatsCardsProps {
  stats: AVProjectStats | undefined;
  isLoading: boolean;
}

export function AVProjectStatsCards({ stats, isLoading }: AVProjectStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Projetos Ativos',
      value: stats?.active || 0,
      icon: Film,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-l-primary',
    },
    {
      title: 'Projetos em Atraso',
      value: stats?.overdue || 0,
      icon: AlertTriangle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-l-orange-500',
    },
    {
      title: 'Projetos Entregues',
      value: stats?.completed || 0,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-l-success',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className={`border-l-4 ${card.borderColor} ${card.bgColor.replace('/10', '/5')}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{card.title}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
