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
    { title: 'Tarefas Ativas', value: stats.active, icon: CheckSquare, color: 'text-primary', bgColor: 'bg-primary/10' },
    { title: 'Tarefas Urgentes', value: stats.urgent, icon: AlertCircle, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { title: 'Tarefas Atrasadas', value: stats.overdue, icon: Clock, color: 'text-destructive', bgColor: 'bg-destructive/10' },
  ];

  return (
    <StatsCardGrid columns={3}>
      {cards.map(card => <StatsCard key={card.title} {...card} />)}
    </StatsCardGrid>
  );
}
