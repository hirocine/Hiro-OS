import { CheckSquare, AlertCircle, Clock, Lock } from 'lucide-react';
import { StatsCard, StatsCardGrid, StatsCardSkeleton } from '@/components/ui/stats-card';
import { useTaskStats } from '../hooks/useTaskStats';

export function TaskStatsCards() {
  const { stats, isLoading } = useTaskStats();

  if (isLoading) {
    return (
      <StatsCardGrid columns={4}>
        {[1, 2, 3, 4].map(i => <StatsCardSkeleton key={i} />)}
      </StatsCardGrid>
    );
  }

  const cards = [
    { title: 'Tarefas Ativas', value: stats.active, icon: CheckSquare, color: 'text-primary', bgColor: 'bg-primary/10', borderColor: 'border-l-primary' },
    { title: 'Tarefas Urgentes', value: stats.urgent, icon: AlertCircle, color: 'text-orange-500', bgColor: 'bg-orange-500/10', borderColor: 'border-l-orange-500' },
    { title: 'Tarefas Atrasadas', value: stats.overdue, icon: Clock, color: 'text-destructive', bgColor: 'bg-destructive/10', borderColor: 'border-l-destructive' },
    { title: 'Tarefas Privadas', value: stats.private, icon: Lock, color: 'text-purple-500', bgColor: 'bg-purple-500/10', borderColor: 'border-l-purple-500' },
  ];

  return (
    <StatsCardGrid columns={4}>
      {cards.map(card => <StatsCard key={card.title} {...card} />)}
    </StatsCardGrid>
  );
}
