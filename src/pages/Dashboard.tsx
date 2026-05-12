import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useCashFlowData } from '@/hooks/useCashFlowData';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { Money } from '@/ds/components/Money';
import {
  Clock, TrendingUp, TrendingDown, DollarSign, Target, Award,
  Users, Zap, BarChart3, Heart, Hourglass, Calendar,
  Wallet, ArrowDownLeft, ArrowUpRight, Eye, EyeOff, PartyPopper,
  type LucideIcon,
} from 'lucide-react';
import {
  ComposedChart, Bar, Line, Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer as RechartsContainer,
} from 'recharts';

type Tone = 'fg' | 'accent' | 'success' | 'warning' | 'destructive' | 'muted';

const toneColor: Record<Tone, string> = {
  fg: 'hsl(var(--ds-fg-1))',
  accent: 'hsl(var(--ds-accent))',
  success: 'hsl(var(--ds-success))',
  warning: 'hsl(var(--ds-warning))',
  destructive: 'hsl(var(--ds-danger))',
  muted: 'hsl(var(--ds-fg-3))',
};

function Tile({
  title, Icon, value, subtitle, tone = 'fg', accent = false, badge,
}: {
  title: string;
  Icon?: LucideIcon;
  value: string;
  subtitle?: string;
  tone?: Tone;
  accent?: boolean;
  badge?: React.ReactNode;
}) {
  const color = toneColor[tone];
  return (
    <div
      style={{
        border: `1px solid ${accent ? 'hsl(var(--ds-accent) / 0.4)' : 'hsl(var(--ds-line-1))'}`,
        background: accent ? 'hsl(var(--ds-accent) / 0.05)' : 'hsl(var(--ds-surface))',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minHeight: 120,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'hsl(var(--ds-fg-3))', flexWrap: 'wrap' }}>
          {Icon && <Icon size={13} strokeWidth={1.5} style={{ color }} />}
          <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500 }}>
            {title}
          </span>
          {badge}
        </div>
      </div>
      <div
        style={{
          fontFamily: '"HN Display", sans-serif',
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          fontVariantNumeric: 'tabular-nums',
          color,
          marginTop: 2,
        }}
      >
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', lineHeight: 1.4 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(value, 100));
  return (
    <div style={{ height: 4, background: 'hsl(var(--ds-line-2))', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: 'hsl(var(--ds-accent))' }} />
    </div>
  );
}

function SectionHead({ eyebrow, title, Icon }: { eyebrow: string; title: string; Icon: LucideIcon }) {
  return (
    <div className="section-head">
      <div className="section-head-l">
        <span className="section-eyebrow">{eyebrow}</span>
        <span className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Icon size={14} strokeWidth={1.5} />
          {title}
        </span>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const meta = payload.find((p: any) => p.dataKey === 'meta')?.value ?? 0;
  const realizado = payload.find((p: any) => p.dataKey === 'realizado')?.value ?? 0;
  const diff = meta > 0 ? (((realizado - meta) / meta) * 100).toFixed(1) : '0.0';
  const isPositive = Number(diff) >= 0;
  return (
    <div style={{
      background: 'hsl(var(--ds-surface))', border: '1px solid hsl(var(--ds-line-1))',
      padding: 12, fontSize: 12, fontFamily: '"HN Text", sans-serif',
    }}>
      <div style={{ fontWeight: 600, color: 'hsl(var(--ds-fg-1))', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: 'hsl(var(--ds-fg-3))' }}>
          <span>Meta</span>
          <Money value={meta} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: 'hsl(var(--ds-accent))' }}>
          <span>Realizado</span>
          <Money value={realizado} />
        </div>
      </div>
      <div style={{
        marginTop: 8, paddingTop: 8, borderTop: '1px solid hsl(var(--ds-line-2))',
        color: isPositive ? 'hsl(var(--ds-success))' : 'hsl(var(--ds-warning))',
      }}>
        {isPositive ? '+' : ''}{diff}%
        <span style={{ color: 'hsl(var(--ds-fg-4))', marginLeft: 4 }}>vs meta</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { isAdmin, roleLoading } = useAuthContext();
  const { goals, metrics, monthlyData, loading, lastSyncedAt } = useFinancialData();
  const { data: cashFlow, evolution: cashEvolution, loading: cashFlowLoading, lastSyncedAt: cashLastSynced } = useCashFlowData();
  const lastUpdate = lastSyncedAt ?? cashLastSynced;
  const [valuesHidden, setValuesHidden] = useState(true);

  const currentMonthLabel = useMemo(() => {
    const raw = new Date().toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, []);

  const currentMonth = new Date().getMonth();
  const ytdGoal = useMemo(() => Math.round((goals.revenue_goal / 12) * (currentMonth + 1)), [goals.revenue_goal, currentMonth]);
  const annualProgress = useMemo(() =>
    goals.revenue_goal > 0 ? Math.round((metrics.accumulated_revenue_ytd / goals.revenue_goal) * 100) : 0,
    [metrics.accumulated_revenue_ytd, goals.revenue_goal]
  );
  const monthlyGoal = useMemo(() => Math.round(goals.revenue_goal / 12), [goals.revenue_goal]);
  const monthlyProgress = useMemo(() =>
    monthlyGoal > 0 ? Math.round((metrics.total_revenue / monthlyGoal) * 100) : 0,
    [metrics.total_revenue, monthlyGoal]
  );
  const ytdProgress = useMemo(() =>
    ytdGoal > 0 ? Math.round((metrics.accumulated_revenue_ytd / ytdGoal) * 100) : 0,
    [metrics.accumulated_revenue_ytd, ytdGoal]
  );
  const ltvCacRatio = useMemo(() => metrics.cac > 0 ? (metrics.ltv / metrics.cac).toFixed(1) : '–', [metrics.ltv, metrics.cac]);

  const chartData = useMemo(() =>
    monthlyData.map(d => ({ ...d, realizado: d.realizado > 0 ? d.realizado : null })),
    [monthlyData]
  );

  const marginAlert = metrics.contribution_margin_actual < goals.margin_goal_pct;
  const profitAlert = metrics.net_profit_actual < goals.profit_goal_pct;
  const monthlyGoalExceeded = monthlyProgress > 100;
  const hidden = valuesHidden ? 'R$ ••••••' : '';

  if (!roleLoading && !isAdmin) return <Navigate to="/" replace />;

  const isLoading = roleLoading || loading;

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <div className="ph">
          <div>
            <h1 className="ph-title">Dashboard Financeiro.</h1>
            <p className="ph-sub">
              Visão executiva de performance e saúde financeira.
              <span className="meta">
                <Clock size={12} strokeWidth={1.5} />
                {lastUpdate ? `Sincronizado ${formatRelativeTime(lastUpdate)}` : 'Dados de exemplo'}
              </span>
            </p>
          </div>
          <div className="ph-actions">
            <button
              type="button"
              onClick={() => setValuesHidden(v => !v)}
              className="btn"
              aria-label={valuesHidden ? 'Mostrar valores' : 'Esconder valores'}
            >
              {valuesHidden ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
              <span>{valuesHidden ? 'Mostrar valores' : 'Esconder valores'}</span>
            </button>
          </div>
        </div>

        {/* Mês Atual */}
        <section className="section">
          <SectionHead eyebrow="01" title={`Mês Atual (${currentMonthLabel})`} Icon={Calendar} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div
              style={{
                border: `1px solid ${monthlyGoalExceeded ? 'hsl(var(--ds-success) / 0.4)' : 'hsl(var(--ds-line-1))'}`,
                background: monthlyGoalExceeded ? 'hsl(var(--ds-success) / 0.05)' : 'hsl(var(--ds-surface))',
                padding: '18px 20px',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'hsl(var(--ds-fg-3))', flexWrap: 'wrap' }}>
                <TrendingUp size={13} strokeWidth={1.5} />
                <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500 }}>
                  Faturamento do Mês
                </span>
                {monthlyGoalExceeded && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    color: 'hsl(var(--ds-success))', fontSize: 10, fontWeight: 600,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>
                    <PartyPopper size={11} strokeWidth={1.5} />
                    Meta batida
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: '"HN Display", sans-serif', fontSize: 22, fontWeight: 600,
                  letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--ds-fg-1))',
                }}>
                  {hidden || formatCurrency(metrics.total_revenue)}
                </span>
                <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
                  meta {hidden || formatCurrency(monthlyGoal)}
                </span>
              </div>
              <ProgressBar value={monthlyProgress} />
              <div style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>{monthlyProgress}% da meta mensal</div>
            </div>

            <Tile
              title="Margem de Contribuição"
              Icon={Target}
              value={`${metrics.contribution_margin_actual}%`}
              subtitle={
                marginAlert
                  ? `${(goals.margin_goal_pct - metrics.contribution_margin_actual).toFixed(1)}pp abaixo da meta (${goals.margin_goal_pct}%)`
                  : formatCurrency(metrics.contribution_margin_value)
              }
              tone={marginAlert ? 'warning' : 'fg'}
            />
            <Tile
              title="Lucro Líquido"
              Icon={DollarSign}
              value={`${metrics.net_profit_actual}%`}
              subtitle={
                profitAlert
                  ? `${(goals.profit_goal_pct - metrics.net_profit_actual).toFixed(1)}pp abaixo da meta (${goals.profit_goal_pct}%)`
                  : formatCurrency(metrics.net_profit_value)
              }
              tone={profitAlert ? 'warning' : 'fg'}
            />
          </div>
        </section>

        {/* Fluxo de Caixa */}
        <section className="section">
          <SectionHead eyebrow="02" title="Fluxo de Caixa" Icon={Wallet} />
          {cashFlowLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{
                  border: '1px solid hsl(var(--ds-line-1))', minHeight: 120, padding: 20,
                }}>
                  <span className="sk line" style={{ width: '60%' }} />
                  <div style={{ marginTop: 16 }}>
                    <span className="sk line lg" style={{ width: '70%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <Tile
                  title="Saldo Atual"
                  Icon={Wallet}
                  value={hidden || formatCurrency(cashFlow.total_balance)}
                  subtitle="Soma de todas as contas bancárias"
                  tone="accent"
                  accent
                />
                <div style={{ border: '1px solid hsl(var(--ds-line-1))', padding: '18px 20px', background: 'hsl(var(--ds-surface))' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'hsl(var(--ds-fg-3))', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500 }}>
                      Evolução de Caixa (2026)
                    </span>
                  </div>
                  <div style={{ height: 220 }}>
                    <RechartsContainer width="100%" height="100%">
                      <AreaChart data={cashEvolution} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <defs>
                          <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--ds-accent))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--ds-accent))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--ds-line-2))" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--ds-fg-4))' }} />
                        <YAxis
                          orientation="right"
                          tickFormatter={(v: number) => valuesHidden ? '•••' : `${(v / 1000).toFixed(0)}k`}
                          tick={{ fontSize: 11, fill: 'hsl(var(--ds-fg-4))' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const val = payload[0]?.value as number;
                            return (
                              <div style={{
                                background: 'hsl(var(--ds-surface))', border: '1px solid hsl(var(--ds-line-1))',
                                padding: 12, fontSize: 12,
                              }}>
                                <div style={{ fontWeight: 600, color: 'hsl(var(--ds-fg-1))', marginBottom: 4 }}>{label}</div>
                                <div style={{ color: 'hsl(var(--ds-accent))', fontVariantNumeric: 'tabular-nums' }}>
                                  {valuesHidden ? 'R$ ••••••' : formatCurrency(val)}
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Area
                          type="monotone" dataKey="balance"
                          stroke="hsl(var(--ds-accent))" strokeWidth={2}
                          fill="url(#cashGradient)"
                          dot={{ fill: 'hsl(var(--ds-accent))', r: 3, strokeWidth: 0 }}
                          activeDot={{ fill: 'hsl(var(--ds-accent))', r: 5, strokeWidth: 2, stroke: 'hsl(var(--ds-surface))' }}
                        />
                      </AreaChart>
                    </RechartsContainer>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <Tile
                  title="Receitas Realizadas" Icon={ArrowDownLeft}
                  value={hidden || formatCurrency(cashFlow.realized_income)}
                  subtitle="Total de entradas do mês atual" tone="success"
                />
                <Tile
                  title="Despesas Realizadas" Icon={ArrowUpRight}
                  value={hidden || formatCurrency(cashFlow.realized_expenses)}
                  subtitle="Total de saídas do mês atual" tone="destructive"
                />
                <Tile
                  title="Fluxo Líquido Atual" Icon={cashFlow.net_flow < 0 ? TrendingDown : TrendingUp}
                  value={hidden || formatCurrency(cashFlow.net_flow)}
                  subtitle="Entradas menos saídas do mês"
                  tone={cashFlow.net_flow < 0 ? 'destructive' : 'success'}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <Tile
                  title="A Receber (30d)" Icon={ArrowDownLeft}
                  value={hidden || formatCurrency(cashFlow.receivables_30d)}
                  subtitle="Total a receber em até 30 dias" tone="success"
                />
                <Tile
                  title="A Pagar (30d)" Icon={ArrowUpRight}
                  value={hidden || formatCurrency(cashFlow.payables_30d)}
                  subtitle="Total a pagar em até 30 dias" tone="destructive"
                />
                <Tile
                  title="Saldo Projetado (30d)" Icon={Target}
                  value={hidden || formatCurrency(cashFlow.projected_balance)}
                  subtitle="Estimativa de caixa em 30 dias"
                  tone={cashFlow.projected_balance < 0 ? 'destructive' : 'accent'}
                  accent={cashFlow.projected_balance >= 0}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <Tile
                  title="A Receber (90d)" Icon={ArrowDownLeft}
                  value={hidden || formatCurrency(cashFlow.receivables_90d)}
                  subtitle="Total a receber em até 90 dias" tone="success"
                />
                <Tile
                  title="A Pagar (90d)" Icon={ArrowUpRight}
                  value={hidden || formatCurrency(cashFlow.payables_90d)}
                  subtitle="Total a pagar em até 90 dias" tone="destructive"
                />
                <Tile
                  title="Saldo Projetado (90d)" Icon={Target}
                  value={hidden || formatCurrency(cashFlow.projected_balance_90d)}
                  subtitle="Estimativa de caixa em 90 dias"
                  tone={cashFlow.projected_balance_90d < 0 ? 'destructive' : 'accent'}
                  accent={cashFlow.projected_balance_90d >= 0}
                />
              </div>
            </div>
          )}
        </section>

        {/* Faturamento */}
        <section className="section">
          <SectionHead eyebrow="03" title="Faturamento (2026)" Icon={BarChart3} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))',
                padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'hsl(var(--ds-fg-3))' }}>
                  <DollarSign size={13} strokeWidth={1.5} />
                  <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500 }}>
                    Meta Anual
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: '"HN Display", sans-serif', fontSize: 20, fontWeight: 600,
                    letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--ds-fg-1))',
                  }}>
                    {hidden || formatCurrency(metrics.accumulated_revenue_ytd)}
                  </span>
                  <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
                    de {hidden || formatCurrency(goals.revenue_goal)}
                  </span>
                </div>
                <ProgressBar value={annualProgress} />
                <div style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>{annualProgress}% atingido</div>
              </div>

              <div style={{
                border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))',
                padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'hsl(var(--ds-fg-3))' }}>
                  <BarChart3 size={13} strokeWidth={1.5} />
                  <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500 }}>
                    Meta YTD
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: '"HN Display", sans-serif', fontSize: 20, fontWeight: 600,
                    letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--ds-fg-1))',
                  }}>
                    {hidden || formatCurrency(metrics.accumulated_revenue_ytd)}
                  </span>
                  <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
                    de {hidden || formatCurrency(ytdGoal)}
                  </span>
                </div>
                <ProgressBar value={ytdProgress} />
                <div style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>
                  {ytdProgress}% da meta até {new Date().toLocaleString('pt-BR', { month: 'long' })}
                </div>
              </div>
            </div>

            <div style={{ border: '1px solid hsl(var(--ds-line-1))', padding: '18px 20px', background: 'hsl(var(--ds-surface))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'hsl(var(--ds-fg-3))', marginBottom: 12 }}>
                <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500 }}>
                  Meta vs Realizado
                </span>
              </div>
              <div style={{ height: 280 }}>
                <RechartsContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--ds-line-2))" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--ds-fg-4))' }} />
                    <YAxis
                      orientation="right"
                      tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 11, fill: 'hsl(var(--ds-fg-4))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="meta" name="Meta" fill="hsl(var(--ds-line-2))" radius={[2, 2, 0, 0]} barSize={28} />
                    <Line
                      type="monotone" dataKey="realizado" name="Realizado"
                      stroke="hsl(var(--ds-accent))" strokeWidth={2}
                      dot={{ fill: 'hsl(var(--ds-accent))', r: 4, strokeWidth: 0 }}
                      activeDot={{ fill: 'hsl(var(--ds-accent))', r: 6, strokeWidth: 2, stroke: 'hsl(var(--ds-surface))' }}
                      connectNulls={false}
                    />
                  </ComposedChart>
                </RechartsContainer>
              </div>
            </div>
          </div>
        </section>

        {/* Indicadores */}
        <section className="section">
          <SectionHead eyebrow="04" title="Indicadores" Icon={Zap} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            <Tile title="% Margem Contribuição" Icon={TrendingUp} value={`${metrics.contribution_margin_actual}%`}
              subtitle={`Meta: ${goals.margin_goal_pct}%`} tone={marginAlert ? 'warning' : 'success'} />
            <Tile title="% Lucro Líquido" Icon={DollarSign} value={`${metrics.net_profit_actual}%`}
              subtitle={`Meta: ${goals.profit_goal_pct}%`} tone={profitAlert ? 'warning' : 'success'} />
            <Tile title="Ticket Médio" Icon={DollarSign} value={hidden || formatCurrency(metrics.avg_ticket)}
              subtitle="Receita média por cliente" />
            <Tile title="LTV" Icon={TrendingUp} value={hidden || formatCurrency(metrics.ltv)}
              subtitle="Lifetime Value" />
            <Tile title="CAC" Icon={Users} value={hidden || formatCurrency(metrics.cac)}
              subtitle={`Meta: ${formatCurrency(goals.cac_goal)}`}
              tone={metrics.cac > goals.cac_goal ? 'warning' : 'fg'} />
            <Tile title="LTV / CAC" Icon={Award} value={`${ltvCacRatio}x`}
              subtitle="Razão ideal > 3x" tone={Number(ltvCacRatio) >= 3 ? 'success' : 'fg'} />
            <Tile title="Churn Rate" Icon={TrendingDown} value={`${metrics.churn_rate}%`}
              subtitle="Taxa de cancelamento" tone={metrics.churn_rate > 5 ? 'warning' : 'fg'} />
            <Tile title="NPS" Icon={Heart} value={String(metrics.nps)}
              subtitle={metrics.nps >= 70 ? 'Excelente' : metrics.nps >= 50 ? 'Bom' : 'Atenção'}
              tone={metrics.nps >= 70 ? 'success' : metrics.nps < 50 ? 'warning' : 'fg'} />
            <Tile title="Burn Rate" Icon={Zap} value={hidden || formatCurrency(metrics.burn_rate)}
              subtitle="Gastos mensais fixos" />
            <Tile title="Cash Runway" Icon={Hourglass} value={`${metrics.cash_runway_months} meses`}
              subtitle={metrics.cash_runway_months <= 6 ? 'Atenção: runway curto' : 'Saúde financeira'}
              tone={metrics.cash_runway_months <= 6 ? 'warning' : metrics.cash_runway_months >= 18 ? 'success' : 'fg'} />
          </div>
        </section>

        {isLoading && (
          <div style={{ marginTop: 16, fontSize: 12, color: 'hsl(var(--ds-fg-4))' }}>
            Carregando dados…
          </div>
        )}
      </div>
    </div>
  );
}
