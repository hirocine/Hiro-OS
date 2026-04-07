import { Film, AlertTriangle, CheckCircle } from 'lucide-react';
import { StatsCard, StatsCardGrid, StatsCardSkeleton } from '@/components/ui/stats-card';
import { AVProjectStats } from '../types';

interface AVProjectStatsCardsProps {
  stats: AVProjectStats | undefined;
  isLoading: boolean;
}

export function AVProjectStatsCards({ stats, isLoading }: AVProjectStatsCardsProps) {
  if (isLoading) {
    return (
      <StatsCardGrid columns={3}>
        {[1, 2, 3].map(i => <StatsCardSkeleton key={i} />)}
      </StatsCardGrid>
    );
  }

  const cards = [
    { title: 'Projetos Ativos', value: stats?.active || 0, icon: Film, color: 'text-primary', bgColor: 'bg-primary/10' },
    { title: 'Projetos em Atraso', value: stats?.overdue || 0, icon: AlertTriangle, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { title: 'Projetos Entregues', value: stats?.completed || 0, icon: CheckCircle, color: 'text-success', bgColor: 'bg-success/10' },
  ];

  return (
    <StatsCardGrid columns={3}>
      {cards.map(card => <StatsCard key={card.title} {...card} />)}
    </StatsCardGrid>
  );
}
