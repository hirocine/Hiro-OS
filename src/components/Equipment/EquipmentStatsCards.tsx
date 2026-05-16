import { Package, CheckCircle, Wrench } from 'lucide-react';
import { StatsCard, StatsCardGrid, StatsCardSkeleton } from '@/components/ui/stats-card';
import { DashboardStats } from '@/types/equipment';

interface EquipmentStatsCardsProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

export function EquipmentStatsCards({ stats, isLoading }: EquipmentStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="mb-6">
        <StatsCardGrid columns={3}>
          {[1, 2, 3].map(i => <StatsCardSkeleton key={i} />)}
        </StatsCardGrid>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total de Equipamentos',
      value: stats.total,
      icon: Package,
      color: 'text-[hsl(var(--ds-text))]',
      bgColor: 'bg-[hsl(var(--ds-text)/0.07)]',
      description: `${stats.mainItems} principais, ${stats.accessories} acessórios`,
    },
    {
      title: 'Disponíveis',
      value: stats.available,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
      description: `${Math.round((stats.available / stats.total) * 100)}% do total`,
    },
    {
      title: 'Em Manutenção',
      value: stats.maintenance,
      icon: Wrench,
      color: 'text-[hsl(0_84%_60%)]',
      bgColor: 'bg-[hsl(0_84%_60%/0.10)]',
      description: stats.maintenance > 0 ? 'Requer atenção' : 'Tudo em ordem',
    },
  ];

  return (
    <div className="mb-6">
      <StatsCardGrid columns={3}>
        {cards.map(card => <StatsCard key={card.title} {...card} />)}
      </StatsCardGrid>
    </div>
  );
}
