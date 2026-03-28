import { DollarSign, TrendingUp, Percent, ArrowUpDown, AlertTriangle } from 'lucide-react';
import { StatsCard, StatsCardGrid, StatsCardSkeleton } from '@/components/ui/stats-card';
import type { RentalStats } from '@/features/rentals/types';

interface RentalStatsCardsProps {
  stats: RentalStats;
  isLoading?: boolean;
}

export function RentalStatsCards({ stats, isLoading }: RentalStatsCardsProps) {
  if (isLoading) {
    return (
      <StatsCardGrid columns={4}>
        {[1, 2, 3, 4].map(i => <StatsCardSkeleton key={i} />)}
      </StatsCardGrid>
    );
  }

  const cards = [
    {
      title: 'Total Investido',
      value: `R$ ${(stats.totalInvested / 1000).toFixed(0)}k`,
      icon: DollarSign,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-l-primary',
      description: `${stats.totalEquipment} equipamentos`,
    },
    {
      title: 'Receita Gerada',
      value: `R$ ${(stats.totalRevenue / 1000).toFixed(0)}k`,
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-l-success',
      description: `ROI: ${stats.roi}%`,
    },
    {
      title: 'Taxa de Ocupação',
      value: `${stats.avgOccupancy}%`,
      icon: Percent,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-l-warning',
      description: `${stats.activeRentals} locações ativas`,
    },
    {
      title: 'Locações Ativas',
      value: stats.activeRentals,
      icon: ArrowUpDown,
      color: stats.overdueRentals > 0 ? 'text-destructive' : 'text-success',
      bgColor: stats.overdueRentals > 0 ? 'bg-destructive/10' : 'bg-success/10',
      borderColor: stats.overdueRentals > 0 ? 'border-l-destructive' : 'border-l-success',
      description: stats.overdueRentals > 0 ? `${stats.overdueRentals} em atraso` : 'Nenhum atraso',
    },
  ];

  return (
    <StatsCardGrid columns={4}>
      {cards.map(card => <StatsCard key={card.title} {...card} />)}
    </StatsCardGrid>
  );
}
