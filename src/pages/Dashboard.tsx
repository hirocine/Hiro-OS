import { useMemo, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFinancialData } from '@/hooks/useFinancialData';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  Clock, TrendingUp, TrendingDown, DollarSign, Target, Award,
  Users, Zap, BarChart3, Heart, PartyPopper, Hourglass, Calendar
} from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer as RechartsContainer
} from 'recharts';

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const meta = payload.find((p: any) => p.dataKey === 'meta')?.value ?? 0;
  const realizado = payload.find((p: any) => p.dataKey === 'realizado')?.value ?? 0;
  const diff = meta > 0 ? (((realizado - meta) / meta) * 100).toFixed(1) : '0.0';
  const isPositive = Number(diff) >= 0;

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-sm bg-white/10 inline-block" />
            Meta
          </span>
          <span className="font-medium text-muted-foreground">{formatCurrency(meta)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-primary">
            <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
            Realizado
          </span>
          <span className="font-medium text-foreground">{formatCurrency(realizado)}</span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-border">
        <span className={isPositive ? 'text-success' : 'text-warning'}>
          {isPositive ? '+' : ''}{diff}%
        </span>
        <span className="text-muted-foreground text-xs ml-1">vs meta</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { isAdmin, roleLoading } = useAuthContext();
  const { goals, metrics, monthlyData, loading } = useFinancialData();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!loading) setLastUpdate(new Date());
  }, [loading]);

  // Current month label
  const currentMonthLabel = useMemo(() => {
    const raw = new Date().toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, []);

  // Derived calculations
  const annualProgress = useMemo(() =>
    Math.round((metrics.accumulated_revenue_ytd / goals.revenue_goal) * 100),
    [metrics.accumulated_revenue_ytd, goals.revenue_goal]
  );

  const currentMonth = new Date().getMonth();
  const ytdGoal = useMemo(() =>
    Math.round((goals.revenue_goal / 12) * (currentMonth + 1)),
    [goals.revenue_goal, currentMonth]
  );

  const monthlyGoal = useMemo(() => Math.round(goals.revenue_goal / 12), [goals.revenue_goal]);
  const monthlyProgress = useMemo(() =>
    Math.round((metrics.total_revenue / monthlyGoal) * 100),
    [metrics.total_revenue, monthlyGoal]
  );

  const ltvCacRatio = useMemo(() =>
    metrics.cac > 0 ? (metrics.ltv / metrics.cac).toFixed(1) : '–',
    [metrics.ltv, metrics.cac]
  );

  const marginAlert = metrics.contribution_margin_actual < goals.margin_goal_pct;
  const profitAlert = metrics.net_profit_actual < goals.profit_goal_pct;
  const monthlyGoalExceeded = monthlyProgress > 100;

  if (!roleLoading && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (roleLoading || loading) {
    return (
      <ResponsiveContainer maxWidth="7xl">
        <PageHeader title="Dashboard Financeiro" subtitle="Carregando dados..." />
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-lg" />)}
          </div>
          <Skeleton className="h-80 w-full rounded-lg" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
          </div>
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer maxWidth="7xl" className="animate-fade-in">
      <PageHeader
        title="Dashboard Financeiro"
        subtitle={
          <>
            Visão executiva de performance e saúde financeira
            {lastUpdate && (
              <>
                <span className="text-muted-foreground/50"> • </span>
                <span className="text-xs text-muted-foreground/70 inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Atualizado {formatRelativeTime(lastUpdate)}
                </span>
              </>
            )}
          </>
        }
      />

      <div className="space-y-6 lg:space-y-8">
        {/* Section 1: Mês Atual */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-xl lg:text-2xl font-semibold">Mês Atual ({currentMonthLabel})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Faturamento do Mês */}
            <Card className={cn(
              "shadow-card hover:shadow-elegant transition-all duration-200",
              monthlyGoalExceeded && "border-success/30 bg-success/5"
            )}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Faturamento do Mês
                  {monthlyGoalExceeded && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                      <PartyPopper className="h-3 w-3" />
                      Meta batida!
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-foreground">{formatCurrency(metrics.total_revenue)}</span>
                  <span className="text-sm text-muted-foreground">meta {formatCurrency(monthlyGoal)}</span>
                </div>
                <Progress value={Math.min(monthlyProgress, 100)} className="h-2" />
                <p className="text-xs text-muted-foreground">{monthlyProgress}% da meta mensal</p>
              </CardContent>
            </Card>

            {/* Margem de Contribuição */}
            <Card className={cn(
              "shadow-card hover:shadow-elegant transition-all duration-200",
              marginAlert && "border-warning/30"
            )}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Margem de Contribuição
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className={cn(
                    "text-2xl font-bold",
                    marginAlert ? "text-warning" : "text-foreground"
                  )}>
                    {formatCurrency(metrics.contribution_margin_value)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {metrics.contribution_margin_actual}% do faturamento
                </p>
                {marginAlert && (
                  <p className="text-xs text-warning flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    {(goals.margin_goal_pct - metrics.contribution_margin_actual).toFixed(1)}pp abaixo da meta ({goals.margin_goal_pct}%)
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Lucro Líquido */}
            <Card className={cn(
              "shadow-card hover:shadow-elegant transition-all duration-200",
              profitAlert && "border-warning/30"
            )}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Lucro Líquido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className={cn(
                    "text-2xl font-bold",
                    profitAlert ? "text-warning" : "text-foreground"
                  )}>
                    {formatCurrency(metrics.net_profit_value)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {metrics.net_profit_actual}% do faturamento
                </p>
                {profitAlert && (
                  <p className="text-xs text-warning flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    {(goals.profit_goal_pct - metrics.net_profit_actual).toFixed(1)}pp abaixo da meta ({goals.profit_goal_pct}%)
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 2: Faturamento (2026) */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-xl lg:text-2xl font-semibold">Faturamento (2026)</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Left column: Meta Anual + Meta YTD */}
            <div className="space-y-4">
              <Card className="shadow-card hover:shadow-elegant transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Meta Anual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-foreground">{formatCurrency(metrics.accumulated_revenue_ytd)}</span>
                    <span className="text-sm text-muted-foreground">de {formatCurrency(goals.revenue_goal)}</span>
                  </div>
                  <Progress value={Math.min(annualProgress, 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground">{annualProgress}% atingido</p>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elegant transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Meta YTD
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-foreground">{formatCurrency(metrics.accumulated_revenue_ytd)}</span>
                    <span className="text-sm text-muted-foreground">de {formatCurrency(ytdGoal)}</span>
                  </div>
                  <Progress value={Math.min(Math.round((metrics.accumulated_revenue_ytd / ytdGoal) * 100), 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {Math.round((metrics.accumulated_revenue_ytd / ytdGoal) * 100)}% da meta até {new Date().toLocaleString('pt-BR', { month: 'long' })}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Right column: Chart */}
            <Card className="lg:col-span-2 shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Meta vs Realizado (2026)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <RechartsContainer width="100%" height="100%">
                    <ComposedChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis
                        orientation="right"
                        tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="meta" name="Meta" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} barSize={32} />
                      <Line
                        type="monotone"
                        dataKey="realizado"
                        name="Realizado"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--primary))', r: 5, strokeWidth: 0 }}
                        activeDot={{ fill: 'hsl(var(--primary))', r: 7, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                      />
                    </ComposedChart>
                  </RechartsContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 3: Indicadores */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-xl lg:text-2xl font-semibold">Indicadores</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <UnitCard
              title="% Margem Contribuição"
              value={`${metrics.contribution_margin_actual}%`}
              icon={TrendingUp}
              subtitle={`Meta: ${goals.margin_goal_pct}%`}
              alert={marginAlert}
              highlight={!marginAlert}
            />
            <UnitCard
              title="% Lucro Líquido"
              value={`${metrics.net_profit_actual}%`}
              icon={DollarSign}
              subtitle={`Meta: ${goals.profit_goal_pct}%`}
              alert={profitAlert}
              highlight={!profitAlert}
            />
            <UnitCard
              title="Ticket Médio"
              value={formatCurrency(metrics.avg_ticket)}
              icon={DollarSign}
              subtitle="Receita média por cliente"
            />
            <UnitCard
              title="LTV"
              value={formatCurrency(metrics.ltv)}
              icon={TrendingUp}
              subtitle="Lifetime Value"
            />
            <UnitCard
              title="CAC"
              value={formatCurrency(metrics.cac)}
              icon={Users}
              subtitle={`Meta: ${formatCurrency(goals.cac_goal)}`}
              alert={metrics.cac > goals.cac_goal}
            />
            <UnitCard
              title="LTV/CAC"
              value={`${ltvCacRatio}x`}
              icon={Award}
              subtitle="Razão ideal > 3x"
              highlight={Number(ltvCacRatio) >= 3}
            />
            <UnitCard
              title="Churn Rate"
              value={`${metrics.churn_rate}%`}
              icon={TrendingDown}
              subtitle="Taxa de cancelamento"
              alert={metrics.churn_rate > 5}
            />
            <UnitCard
              title="NPS"
              value={String(metrics.nps)}
              icon={Heart}
              subtitle={metrics.nps >= 70 ? 'Excelente' : metrics.nps >= 50 ? 'Bom' : 'Atenção'}
              highlight={metrics.nps >= 70}
              alert={metrics.nps < 50}
            />
            <UnitCard
              title="Burn Rate"
              value={formatCurrency(metrics.burn_rate)}
              icon={Zap}
              subtitle="Gastos mensais fixos"
            />
            <UnitCard
              title="Cash Runway"
              value={`${metrics.cash_runway_months} meses`}
              icon={Hourglass}
              subtitle={metrics.cash_runway_months <= 6 ? 'Atenção: runway curto' : 'Saúde financeira'}
              alert={metrics.cash_runway_months <= 6}
              highlight={metrics.cash_runway_months >= 18}
            />
          </div>
        </section>
      </div>
    </ResponsiveContainer>
  );
}

function UnitCard({ title, value, icon: Icon, subtitle, alert, highlight }: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
  alert?: boolean;
  highlight?: boolean;
}) {
  return (
    <Card className={cn(
      "shadow-card hover:shadow-elegant transition-all duration-200 hover:scale-[1.02]",
      alert && "border-warning/30",
      highlight && "border-success/30"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <Icon className={cn(
          "h-4 w-4",
          alert ? "text-warning" : highlight ? "text-success" : "text-muted-foreground"
        )} />
      </CardHeader>
      <CardContent>
        <div className={cn(
          "text-xl lg:text-2xl font-bold",
          alert ? "text-warning" : highlight ? "text-success" : "text-foreground"
        )}>
          {value}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
