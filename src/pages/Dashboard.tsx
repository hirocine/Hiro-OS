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
  Users, Zap, BarChart3, Heart, PartyPopper, Hourglass, Calendar,
  Wallet, ArrowDownLeft, ArrowUpRight, Eye, EyeOff
} from 'lucide-react';
import { useCashFlowData } from '@/hooks/useCashFlowData';
import {
  ComposedChart, Bar, Line, Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer as RechartsContainer
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
  const { data: cashFlow, evolution: cashEvolution, loading: cashFlowLoading } = useCashFlowData();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [valuesHidden, setValuesHidden] = useState(true);

  const toggleValuesVisibility = () => {
    setValuesHidden(prev => !prev);
  };

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

  const chartData = useMemo(() =>
    monthlyData.map(d => ({
      ...d,
      realizado: d.realizado > 0 ? d.realizado : null,
    })),
    [monthlyData]
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
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
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">Mês Atual ({currentMonthLabel})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Faturamento do Mês */}
            <Card className={cn(
              "shadow-card hover:shadow-elegant transition-all duration-200",
              monthlyGoalExceeded && "border-success/30 bg-success/5"
            )}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2 flex-wrap">
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
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
                  <span className="text-xl sm:text-2xl font-bold text-foreground">{formatCurrency(metrics.total_revenue)}</span>
                  <span className="text-xs text-muted-foreground">meta {formatCurrency(monthlyGoal)}</span>
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
                <div className={cn(
                  "text-3xl sm:text-4xl font-bold",
                  marginAlert ? "text-warning" : "text-foreground"
                )}>
                  {metrics.contribution_margin_actual}%
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(metrics.contribution_margin_value)}
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
                <div className={cn(
                  "text-3xl sm:text-4xl font-bold",
                  profitAlert ? "text-warning" : "text-foreground"
                )}>
                  {metrics.net_profit_actual}%
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(metrics.net_profit_value)}
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

        {/* Section 2: Fluxo de Caixa */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">Fluxo de Caixa</h2>
          </div>
          {cashFlowLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-lg" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Linha 1: Saldo Atual + Gráfico de Evolução */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="border-primary/40 bg-primary/5 shadow-card hover:shadow-elegant transition-all duration-200 flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-primary/80">
                      Saldo Atual Disponível
                    </CardTitle>
                    <button
                      onClick={toggleValuesVisibility}
                      className="p-1.5 rounded-md hover:bg-primary/10 transition-colors"
                      aria-label={valuesHidden ? 'Mostrar valores' : 'Esconder valores'}
                    >
                      {valuesHidden ? (
                        <EyeOff className="h-4 w-4 text-primary" />
                      ) : (
                        <Eye className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-primary">
                      {valuesHidden ? 'R$ ••••••' : formatCurrency(cashFlow.total_balance)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Soma de todas as contas bancárias</p>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2 shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Evolução de Caixa (2026)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-52 sm:h-64 lg:h-80">
                      <RechartsContainer width="100%" height="100%">
                        <AreaChart data={cashEvolution} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                          <defs>
                            <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis
                            orientation="right"
                            tickFormatter={(v: number) => valuesHidden ? '•••' : `${(v / 1000).toFixed(0)}k`}
                            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (!active || !payload?.length) return null;
                              const val = payload[0]?.value as number;
                              return (
                                <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
                                  <p className="font-semibold text-foreground mb-1">{label}</p>
                                  <p className="text-primary font-medium">{valuesHidden ? 'R$ ••••••' : formatCurrency(val)}</p>
                                </div>
                              );
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="balance"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            fill="url(#cashGradient)"
                            dot={{ fill: 'hsl(var(--primary))', r: 4, strokeWidth: 0 }}
                            activeDot={{ fill: 'hsl(var(--primary))', r: 6, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                          />
                        </AreaChart>
                      </RechartsContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Linha 2: Realizado do Mês */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <CashFlowDashCard
                  title="Receitas Realizado"
                  value={cashFlow.realized_income}
                  icon={ArrowDownLeft}
                  subtitle="Dinheiro que já entrou no mês"
                  iconClassName="text-success"
                  valueClassName="text-success"
                  displayValue={valuesHidden ? 'R$ ••••••' : formatCurrency(cashFlow.realized_income)}
                />
                <CashFlowDashCard
                  title="Despesas Realizado"
                  value={cashFlow.realized_expenses}
                  icon={ArrowUpRight}
                  subtitle="Dinheiro que já saiu no mês"
                  iconClassName="text-destructive"
                  valueClassName="text-destructive"
                  displayValue={valuesHidden ? 'R$ ••••••' : formatCurrency(cashFlow.realized_expenses)}
                />
                <CashFlowDashCard
                  title="Fluxo Líquido Atual"
                  value={cashFlow.net_flow}
                  icon={cashFlow.net_flow < 0 ? TrendingDown : TrendingUp}
                  subtitle={valuesHidden ? 'R$ •••••• − R$ ••••••' : `${formatCurrency(cashFlow.realized_income)} − ${formatCurrency(cashFlow.realized_expenses)}`}
                  iconClassName={cashFlow.net_flow < 0 ? 'text-destructive' : 'text-success'}
                  valueClassName={cashFlow.net_flow < 0 ? 'text-destructive' : 'text-success'}
                  displayValue={valuesHidden ? 'R$ ••••••' : formatCurrency(cashFlow.net_flow)}
                />
              </div>

              {/* Linha 3: Projeção / Não Realizado */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <CashFlowDashCard
                  title="Contas a Receber"
                  value={cashFlow.receivables_30d}
                  icon={ArrowDownLeft}
                  subtitle="Previsto para entrar (não realizado)"
                  iconClassName="text-success"
                  valueClassName="text-success"
                  displayValue={valuesHidden ? 'R$ ••••••' : formatCurrency(cashFlow.receivables_30d)}
                />
                <CashFlowDashCard
                  title="Contas a Pagar"
                  value={cashFlow.payables_30d}
                  icon={ArrowUpRight}
                  subtitle="Compromissos pendentes (não realizado)"
                  iconClassName="text-destructive"
                  valueClassName="text-destructive"
                  displayValue={valuesHidden ? 'R$ ••••••' : formatCurrency(cashFlow.payables_30d)}
                />
                <CashFlowDashCard
                  title="Saldo Projetado (Fim do Mês)"
                  value={cashFlow.projected_balance}
                  icon={Target}
                  subtitle="Saldo + Receber − Pagar"
                  cardClassName={cn(
                    'border-primary/40 bg-primary/5',
                    cashFlow.projected_balance < 0 && 'border-destructive/40 bg-destructive/5'
                  )}
                  iconClassName={cashFlow.projected_balance < 0 ? 'text-destructive' : 'text-primary'}
                  valueClassName={cashFlow.projected_balance < 0 ? 'text-destructive' : 'text-primary'}
                  displayValue={valuesHidden ? 'R$ ••••••' : formatCurrency(cashFlow.projected_balance)}
                />
              </div>
            </div>
          )}
        </section>

        {/* Section 3: Faturamento (2026) */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">Faturamento (2026)</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Left column: Meta Anual + Meta YTD */}
            <div className="flex flex-col gap-4 h-full">
              <Card className="shadow-card hover:shadow-elegant transition-all duration-200 flex-1 flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Meta Anual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 flex flex-col justify-center">
                  <div className="flex flex-col lg:flex-row lg:items-baseline lg:justify-between gap-0.5">
                    <span className="text-lg lg:text-xl font-bold text-foreground">{formatCurrency(metrics.accumulated_revenue_ytd)}</span>
                    <span className="text-xs text-muted-foreground">de {formatCurrency(goals.revenue_goal)}</span>
                  </div>
                  <Progress value={Math.min(annualProgress, 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground">{annualProgress}% atingido</p>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elegant transition-all duration-200 flex-1 flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Meta YTD
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 flex flex-col justify-center">
                  <div className="flex flex-col lg:flex-row lg:items-baseline lg:justify-between gap-0.5">
                    <span className="text-lg lg:text-xl font-bold text-foreground">{formatCurrency(metrics.accumulated_revenue_ytd)}</span>
                    <span className="text-xs text-muted-foreground">de {formatCurrency(ytdGoal)}</span>
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
                <div className="h-52 sm:h-64 lg:h-80">
                  <RechartsContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
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
                        connectNulls={false}
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
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">Indicadores</h2>
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

function CashFlowDashCard({ title, icon: Icon, subtitle, iconClassName, valueClassName, cardClassName, displayValue }: {
  title: string;
  value?: number;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
  iconClassName?: string;
  valueClassName?: string;
  cardClassName?: string;
  displayValue: string;
}) {
  return (
    <Card className={cn('shadow-card hover:shadow-elegant transition-all duration-200 hover:scale-[1.02]', cardClassName)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider line-clamp-2">
          {title}
        </CardTitle>
        <Icon className={cn('h-4 w-4 text-muted-foreground', iconClassName)} />
      </CardHeader>
      <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
        <div className={cn('text-base sm:text-lg lg:text-xl font-bold truncate', valueClassName)}>
          {displayValue}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider line-clamp-2">
          {title}
        </CardTitle>
        <Icon className={cn(
          "h-4 w-4",
          alert ? "text-warning" : highlight ? "text-success" : "text-muted-foreground"
        )} />
      </CardHeader>
      <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
        <div className={cn(
          "text-base sm:text-lg lg:text-xl font-bold truncate",
          alert ? "text-warning" : highlight ? "text-success" : "text-foreground"
        )}>
          {value}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
