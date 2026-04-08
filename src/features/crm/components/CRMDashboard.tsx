import { Users, Handshake, DollarSign, TrendingUp } from 'lucide-react';
import { StatsCard, StatsCardGrid, StatsCardSkeleton } from '@/components/ui/stats-card';
import { useCRMStats } from '../hooks/useCRMStats';
import { formatBRL } from '../types/crm.types';

export function CRMDashboard() {
  const { data: stats, isLoading } = useCRMStats();

  if (isLoading) {
    return (
      <StatsCardGrid columns={4}>
        {Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)}
      </StatsCardGrid>
    );
  }

  return (
    <StatsCardGrid columns={4}>
      <StatsCard
        title="Total de Contatos"
        value={stats?.totalContacts ?? 0}
        icon={Users}
        color="text-blue-600"
        bgColor="bg-blue-100 dark:bg-blue-900/30"
      />
      <StatsCard
        title="Deals Ativos"
        value={stats?.activeDeals ?? 0}
        icon={Handshake}
        color="text-amber-600"
        bgColor="bg-amber-100 dark:bg-amber-900/30"
      />
      <StatsCard
        title="Valor do Pipeline"
        value={formatBRL(stats?.pipelineValue ?? 0)}
        icon={DollarSign}
        color="text-emerald-600"
        bgColor="bg-emerald-100 dark:bg-emerald-900/30"
      />
      <StatsCard
        title="Taxa de Conversão"
        value={`${stats?.conversionRate ?? 0}%`}
        icon={TrendingUp}
        color="text-purple-600"
        bgColor="bg-purple-100 dark:bg-purple-900/30"
      />
    </StatsCardGrid>
  );
}
