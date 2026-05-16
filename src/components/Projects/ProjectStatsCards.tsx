import { FolderOpen, Clock, Play } from 'lucide-react';
import { StatsCard, StatsCardGrid, StatsCardSkeleton } from '@/components/ui/stats-card';
import { ProjectStats } from '@/types/project';

interface ProjectStatsCardsProps {
  stats: ProjectStats | undefined;
  isLoading: boolean;
}

export function ProjectStatsCards({ stats, isLoading }: ProjectStatsCardsProps) {
  if (isLoading) {
    return (
      <StatsCardGrid columns={3}>
        {[1, 2, 3].map(i => <StatsCardSkeleton key={i} />)}
      </StatsCardGrid>
    );
  }

  const cards = [
    { title: 'Retiradas Ativas', value: stats?.active || 0, icon: FolderOpen, color: 'text-[hsl(var(--ds-text))]', bgColor: 'bg-[hsl(var(--ds-text)/0.07)]' },
    { title: 'Pendente Separação', value: stats?.byStep?.pending_separation || 0, icon: Clock, color: 'text-warning', bgColor: 'bg-warning/10' },
    { title: 'Em Gravação', value: stats?.byStep?.in_use || 0, icon: Play, color: 'text-success', bgColor: 'bg-success/10' },
  ];

  return (
    <StatsCardGrid columns={3}>
      {cards.map(card => <StatsCard key={card.title} {...card} />)}
    </StatsCardGrid>
  );
}
