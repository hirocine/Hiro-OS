import { CheckSquare, AlertCircle, Clock } from 'lucide-react';
import { StatsCard, StatsCardGrid, StatsCardSkeleton } from '@/components/ui/stats-card';
import { useTaskStats } from '../hooks/useTaskStats';

export function TaskStatsCards() {
  const { stats, isLoading } = useTaskStats();

  if (isLoading) {
    return (
      <StatsCardGrid columns={3}>
        {[1, 2, 3].map(i => <StatsCardSkeleton key={i} />)}
      </StatsCardGrid>
    );
  }

  const cards = [
    { title: 'Tarefas Ativas', value: stats.active, icon: CheckSquare, color: 'text-[hsl(var(--ds-text))]', bgColor: 'bg-[hsl(var(--ds-text)/0.07)]' },
    { title: 'Tarefas Urgentes', value: stats.urgent, icon: AlertCircle, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { title: 'Tarefas Atrasadas', value: stats.overdue, icon: Clock, color: 'text-[hsl(0_84%_60%)]', bgColor: 'bg-[hsl(0_84%_60%/0.10)]' },
  ];

  return (
    <StatsCardGrid columns={3}>
      {cards.map(card => <StatsCard key={card.title} {...card} />)}
    </StatsCardGrid>
  );
}
