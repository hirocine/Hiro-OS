import { useMemo } from 'react';
import { Users, Handshake, DollarSign, TrendingUp, AlertTriangle, Clock, CalendarClock, CircleDollarSign, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { StatsCard, StatsCardGrid, StatsCardSkeleton } from '@/components/ui/stats-card';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useCRMStats } from '../hooks/useCRMStats';
import { useDeals } from '../hooks/useDeals';
import { useActivities } from '../hooks/useActivities';
import { useContacts } from '../hooks/useContacts';
import { usePipelineStages } from '../hooks/usePipelineStages';
import { formatBRL, LEAD_SOURCES } from '../types/crm.types';
import { differenceInDays, formatDistanceToNow, format, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer as RechContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const DONUT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#6366f1'];

export function CRMDashboard() {
  const { data: stats, isLoading } = useCRMStats();
  const { data: allDeals } = useDeals();
  const { data: pendingActivities } = useActivities({ pending: true });
  const { data: allContacts } = useContacts();
  const { data: stages } = usePipelineStages();

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

  // Chart data: funnel
  const funnelData = useMemo(() => {
    if (!stages || !allDeals) return [];
    const activeStages = stages.filter(s => !s.is_won && !s.is_lost);
    return activeStages.map(stage => {
      const count = allDeals.filter(d => d.stage_id === stage.id).length;
      return { name: stage.name, count, fill: stage.color ?? '#6366f1' };
    });
  }, [stages, allDeals]);

  // Chart data: lead sources donut
  const leadSourceData = useMemo(() => {
    if (!allContacts) return [];
    const counts = new Map<string, number>();
    allContacts.forEach(c => {
      const src = c.lead_source || 'sem_origem';
      counts.set(src, (counts.get(src) ?? 0) + 1);
    });
    const total = allContacts.length || 1;
    return Array.from(counts.entries()).map(([key, value]) => ({
      name: LEAD_SOURCES.find(s => s.value === key)?.label ?? (key === 'sem_origem' ? 'Sem origem' : key),
      value,
      pct: Math.round((value / total) * 100),
    }));
  }, [allContacts]);

  // Chart data: monthly won revenue (last 6 months)
  const monthlyRevenue = useMemo(() => {
    if (!allDeals) return [];
    const wonDeals = allDeals.filter(d => d.stage_is_won && d.closed_at);
    const now = new Date();
    const months: { label: string; start: Date; end: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const s = startOfMonth(subMonths(now, i));
      const e = startOfMonth(subMonths(now, i - 1));
      months.push({ label: format(s, 'MMM', { locale: ptBR }), start: s, end: e });
    }
    return months.map(m => {
      const total = wonDeals
        .filter(d => {
          const closed = new Date(d.closed_at!);
          return closed >= m.start && closed < m.end;
        })
        .reduce((sum, d) => sum + (d.estimated_value ?? 0), 0);
      return { name: m.label.charAt(0).toUpperCase() + m.label.slice(1), value: total };
    });
  }, [allDeals]);

  if (isLoading) {
    return (
      <StatsCardGrid columns={5}>
        {Array.from({ length: 5 }).map((_, i) => <StatsCardSkeleton key={i} />)}
      </StatsCardGrid>
    );
  }

  return (
    <div className="space-y-6">
      <StatsCardGrid columns={5}>
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
          title="Receita Fechada"
          value={formatBRL(stats?.wonRevenue ?? 0)}
          icon={CircleDollarSign}
          color="text-green-600"
          bgColor="bg-green-100 dark:bg-green-900/30"
        />
        <StatsCard
          title="Taxa de Conversão"
          value={`${stats?.conversionRate ?? 0}%`}
          icon={TrendingUp}
          color="text-purple-600"
          bgColor="bg-purple-100 dark:bg-purple-900/30"
        />
      </StatsCardGrid>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funil de Vendas - full width */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <BarChart3 className="h-4 w-4" />
                Funil de Vendas
              </div>
            </div>
            {funnelData.length > 0 ? (
              <RechContainer width="100%" height={250}>
                <BarChart data={funnelData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => [`${value} deals`, 'Quantidade']} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {funnelData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </RechContainer>
            ) : (
              <EmptyState compact icon={BarChart3} title="Sem dados" description="Adicione deals para ver o funil." />
            )}
          </CardContent>
        </Card>

        {/* Origem dos Leads - donut */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <PieChartIcon className="h-4 w-4" />
                Origem dos Leads
              </div>
            </div>
            {leadSourceData.length > 0 ? (
              <RechContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={leadSourceData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    label={({ pct }) => `${pct}%`}
                  >
                    {leadSourceData.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} />
                  <Tooltip formatter={(value: number, name: string) => [`${value} contatos`, name]} />
                </PieChart>
              </RechContainer>
            ) : (
              <EmptyState compact icon={PieChartIcon} title="Sem dados" description="Adicione contatos para ver a distribuição." />
            )}
          </CardContent>
        </Card>

        {/* Receita Fechada por Mês */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                Receita Fechada por Mês
              </div>
            </div>
            {monthlyRevenue.some(m => m.value > 0) ? (
              <RechContainer width="100%" height={280}>
                <BarChart data={monthlyRevenue} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => formatBRL(v).replace('R$\u00a0', 'R$ ')} />
                  <Tooltip formatter={(value: number) => [formatBRL(value), 'Receita']} />
                  <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </RechContainer>
            ) : (
              <EmptyState compact icon={TrendingUp} title="Sem receita" description="Feche deals para ver a receita mensal." />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Atenção Necessária */}
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
