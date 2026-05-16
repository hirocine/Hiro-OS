import { useMemo } from 'react';
import { Users, Handshake, DollarSign, TrendingUp, AlertTriangle, Clock, CalendarClock, CircleDollarSign, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { StatsCard, StatsCardGrid, StatsCardSkeleton } from '@/components/ui/stats-card';
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

const DONUT_COLORS = [
  'hsl(var(--ds-accent))',
  'hsl(var(--ds-success))',
  'hsl(var(--ds-warning))',
  'hsl(var(--ds-danger))',
  'hsl(var(--ds-info))',
  'hsl(var(--ds-fg-3))',
  'hsl(var(--ds-fg-2))',
  'hsl(var(--ds-fg-4))',
];

const cardWrap: React.CSSProperties = {
  border: '1px solid hsl(var(--ds-line-1))',
  background: 'hsl(var(--ds-surface))',
};

const cardHeader: React.CSSProperties = {
  padding: '14px 18px',
  borderBottom: '1px solid hsl(var(--ds-line-1))',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const cardTitle: React.CSSProperties = {
  fontFamily: '"HN Display", sans-serif',
  fontSize: 14,
  fontWeight: 600,
  color: 'hsl(var(--ds-fg-1))',
};

const cardBody: React.CSSProperties = {
  padding: 18,
};

export function CRMDashboard() {
  const { data: stats, isLoading } = useCRMStats();
  const { data: allDeals } = useDeals();
  const { data: pendingActivities } = useActivities({ pending: true });
  const { data: allContacts } = useContacts();
  const { data: stages } = usePipelineStages();

  const staleDeals = (allDeals ?? []).filter((d) => {
    if (d.stage_is_won || d.stage_is_lost) return false;
    const days = differenceInDays(new Date(), new Date(d.updated_at ?? d.created_at ?? new Date()));
    return days > 7;
  });

  const overdueFollowUps = (pendingActivities ?? []).filter((a) => {
    if (!a.scheduled_at) return false;
    return new Date(a.scheduled_at) < new Date();
  });

  const hasAlerts = staleDeals.length > 0 || overdueFollowUps.length > 0;

  const funnelData = useMemo(() => {
    if (!stages || !allDeals) return [];
    const activeStages = stages.filter((s) => !s.is_won && !s.is_lost);
    return activeStages.map((stage) => {
      const count = allDeals.filter((d) => d.stage_id === stage.id).length;
      return { name: stage.name, count, fill: stage.color ?? 'hsl(var(--ds-accent))' };
    });
  }, [stages, allDeals]);

  const leadSourceData = useMemo(() => {
    if (!allContacts) return [];
    const counts = new Map<string, number>();
    allContacts.forEach((c) => {
      const src = c.lead_source || 'sem_origem';
      counts.set(src, (counts.get(src) ?? 0) + 1);
    });
    const total = allContacts.length || 1;
    return Array.from(counts.entries()).map(([key, value]) => ({
      name: LEAD_SOURCES.find((s) => s.value === key)?.label ?? (key === 'sem_origem' ? 'Sem origem' : key),
      value,
      pct: Math.round((value / total) * 100),
    }));
  }, [allContacts]);

  const monthlyRevenue = useMemo(() => {
    if (!allDeals) return [];
    const wonDeals = allDeals.filter((d) => d.stage_is_won && d.closed_at);
    const now = new Date();
    const months: { label: string; start: Date; end: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const s = startOfMonth(subMonths(now, i));
      const e = startOfMonth(subMonths(now, i - 1));
      months.push({ label: format(s, 'MMM', { locale: ptBR }), start: s, end: e });
    }
    return months.map((m) => {
      const total = wonDeals
        .filter((d) => {
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

  const EmptyChart = ({ Icon, title, description }: { Icon: typeof BarChart3; title: string; description: string }) => (
    <div
      style={{
        height: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 6,
        color: 'hsl(var(--ds-fg-3))',
      }}
    >
      <Icon size={28} strokeWidth={1.25} style={{ color: 'hsl(var(--ds-fg-4))' }} />
      <div style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-2))', fontSize: 13 }}>{title}</div>
      <div style={{ fontSize: 11 }}>{description}</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <StatsCardGrid columns={5}>
        <StatsCard
          title="Total de Contatos"
          value={stats?.totalContacts ?? 0}
          icon={Users}
          color="text-info"
        />
        <StatsCard
          title="Deals Ativos"
          value={stats?.activeDeals ?? 0}
          icon={Handshake}
          color="text-warning"
        />
        <StatsCard
          title="Valor do Pipeline"
          value={formatBRL(stats?.pipelineValue ?? 0)}
          icon={DollarSign}
          color="text-success"
        />
        <StatsCard
          title="Receita Fechada"
          value={formatBRL(stats?.wonRevenue ?? 0)}
          icon={CircleDollarSign}
          color="text-success"
        />
        <StatsCard
          title="Taxa de Conversão"
          value={`${stats?.conversionRate ?? 0}%`}
          icon={TrendingUp}
          color="text-[hsl(var(--ds-text))]"
        />
      </StatsCardGrid>

      <div style={cardWrap}>
        <div style={cardHeader}>
          <BarChart3 size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
          <span style={cardTitle}>Funil de Vendas</span>
        </div>
        <div style={cardBody}>
          {funnelData.length > 0 ? (
            <RechContainer width="100%" height={250}>
              <BarChart data={funnelData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--ds-fg-4))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  tick={{ fontSize: 12, fill: 'hsl(var(--ds-fg-3))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--ds-surface))',
                    border: '1px solid hsl(var(--ds-line-1))',
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`${value} deals`, 'Quantidade']}
                />
                <Bar dataKey="count">
                  {funnelData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </RechContainer>
          ) : (
            <EmptyChart Icon={BarChart3} title="Sem dados" description="Adicione deals para ver o funil." />
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        <div style={cardWrap}>
          <div style={cardHeader}>
            <PieChartIcon size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
            <span style={cardTitle}>Origem dos Leads</span>
          </div>
          <div style={cardBody}>
            {leadSourceData.length > 0 ? (
              <RechContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={leadSourceData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    label={({ pct }) => `${pct}%`}
                    labelLine={false}
                  >
                    {leadSourceData.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--ds-surface))',
                      border: '1px solid hsl(var(--ds-line-1))',
                      fontSize: 12,
                    }}
                    formatter={(value: number, name: string) => [`${value} contatos`, name]}
                  />
                </PieChart>
              </RechContainer>
            ) : (
              <EmptyChart Icon={PieChartIcon} title="Sem dados" description="Adicione contatos para ver a distribuição." />
            )}
          </div>
        </div>

        <div style={cardWrap}>
          <div style={cardHeader}>
            <TrendingUp size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
            <span style={cardTitle}>Receita Fechada por Mês</span>
          </div>
          <div style={cardBody}>
            {monthlyRevenue.some((m) => m.value > 0) ? (
              <RechContainer width="100%" height={260}>
                <BarChart data={monthlyRevenue} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'hsl(var(--ds-fg-4))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'hsl(var(--ds-fg-4))' }}
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--ds-surface))',
                      border: '1px solid hsl(var(--ds-line-1))',
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [formatBRL(value), 'Receita']}
                  />
                  <Bar dataKey="value" fill="hsl(var(--ds-success))" />
                </BarChart>
              </RechContainer>
            ) : (
              <EmptyChart Icon={TrendingUp} title="Sem receita" description="Feche deals para ver a receita mensal." />
            )}
          </div>
        </div>
      </div>

      <div style={cardWrap}>
        <div style={cardHeader}>
          <AlertTriangle size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
          <span style={cardTitle}>Atenção Necessária</span>
        </div>
        <div style={cardBody}>
          {!hasAlerts ? (
            <div
              style={{
                padding: 16,
                textAlign: 'center',
                color: 'hsl(var(--ds-fg-3))',
                fontSize: 12,
              }}
            >
              <AlertTriangle size={28} strokeWidth={1.25} style={{ margin: '0 auto 8px', display: 'block', color: 'hsl(var(--ds-fg-4))' }} />
              <div style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-2))' }}>Tudo em dia!</div>
              <div style={{ marginTop: 4 }}>Nenhuma pendência no momento.</div>
            </div>
          ) : (
            <div>
              {staleDeals.map((deal, idx) => {
                const days = differenceInDays(
                  new Date(),
                  new Date(deal.updated_at ?? deal.created_at ?? new Date())
                );
                return (
                  <div
                    key={deal.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      fontSize: 13,
                      borderBottom: idx === staleDeals.length - 1 && overdueFollowUps.length === 0 ? 0 : '1px solid hsl(var(--ds-line-2))',
                    }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <Clock size={13} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-warning))', flexShrink: 0 }} />
                      <span style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>{deal.title}</span>
                      <span style={{ color: 'hsl(var(--ds-fg-3))' }}>· {deal.contact_name}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                      {days} dias parado
                    </span>
                  </div>
                );
              })}
              {overdueFollowUps.map((act, idx) => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    fontSize: 13,
                    borderBottom: idx === overdueFollowUps.length - 1 ? 0 : '1px solid hsl(var(--ds-line-2))',
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <CalendarClock size={13} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-danger))', flexShrink: 0 }} />
                    <span style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>{act.title}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', flexShrink: 0 }}>
                    {formatDistanceToNow(new Date(act.scheduled_at!), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
