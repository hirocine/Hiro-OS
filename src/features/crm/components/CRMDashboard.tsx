import { Users, Handshake, DollarSign, TrendingUp, AlertTriangle, Clock, CalendarClock } from 'lucide-react';
import { StatsCard, StatsCardGrid, StatsCardSkeleton } from '@/components/ui/stats-card';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useCRMStats } from '../hooks/useCRMStats';
import { useDeals } from '../hooks/useDeals';
import { useActivities } from '../hooks/useActivities';
import { formatBRL } from '../types/crm.types';
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function CRMDashboard() {
  const { data: stats, isLoading } = useCRMStats();
  const { data: allDeals } = useDeals();
  const { data: pendingActivities } = useActivities({ pending: true });

  const staleDeals = (allDeals ?? []).filter(d => {
    if (d.stage_is_won || d.stage_is_lost) return false;
    const days = differenceInDays(new Date(), new Date(d.updated_at ?? d.created_at ?? new Date()));
    return days > 7;
  });

  const overdueFollowUps = (pendingActivities ?? []).filter(a => {
    if (!a.scheduled_at) return false;
    return new Date(a.scheduled_at) < new Date();
  });

  const hasAlerts = staleDeals.length > 0 || overdueFollowUps.length > 0;

  if (isLoading) {
    return (
      <StatsCardGrid columns={4}>
        {Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)}
      </StatsCardGrid>
    );
  }

  return (
    <div className="space-y-6">
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

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              Atenção Necessária
            </div>
          </div>

          {!hasAlerts ? (
            <EmptyState compact icon={AlertTriangle} title="Tudo em dia!" description="Nenhuma pendência no momento." />
          ) : (
            <div className="space-y-2">
              {staleDeals.map(deal => {
                const days = differenceInDays(new Date(), new Date(deal.updated_at ?? deal.created_at ?? new Date()));
                return (
                  <div key={deal.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      <span className="font-medium">{deal.title}</span>
                      <span className="text-muted-foreground">· {deal.contact_name}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">{days} dias parado</span>
                  </div>
                );
              })}
              {overdueFollowUps.map(act => (
                <div key={act.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-3.5 w-3.5 text-rose-500" />
                    <span className="font-medium">{act.title}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(act.scheduled_at!), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
