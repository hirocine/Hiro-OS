import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCashFlowData } from '@/hooks/useCashFlowData';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  Target,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer as RechartsContainer,
} from 'recharts';

function CashFlowSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-40 mb-1" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface CashFlowCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  subtitle?: string;
  iconClassName?: string;
  valueClassName?: string;
  cardClassName?: string;
  blurred?: boolean;
}

function CashFlowCard({
  title,
  value,
  icon: Icon,
  subtitle,
  iconClassName,
  valueClassName,
  cardClassName,
  blurred,
}: CashFlowCardProps) {
  return (
    <Card className={cn('shadow-card hover:shadow-elegant transition-all duration-200 hover:scale-[1.02]', cardClassName)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn('h-4 w-4 text-muted-foreground', iconClassName)} />
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold transition-[filter] duration-300', valueClassName, blurred && 'blur-md select-none')}>
          {formatCurrency(value)}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function CashFlow() {
  const { isAdmin, roleLoading } = useAuthContext();
  const { data, evolution: cashEvolution, loading } = useCashFlowData();
  const [valuesHidden, setValuesHidden] = useState(() =>
    localStorage.getItem('cashflow-values-hidden') === 'true'
  );

  const toggleValuesVisibility = () => {
    const newState = !valuesHidden;
    setValuesHidden(newState);
    localStorage.setItem('cashflow-values-hidden', String(newState));
  };

  const blurClass = cn('transition-[filter] duration-300', valuesHidden && 'blur-md select-none');

  if (!roleLoading && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const isNetFlowNegative = data.net_flow < 0;
  const isProjectedNegative = data.projected_balance < 0;

  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader title="Fluxo de Caixa" />

      {loading || roleLoading ? (
        <CashFlowSkeleton />
      ) : (
        <div className="space-y-4 md:space-y-6">
          {/* Linha 1: Saldo Atual + Gráfico de Evolução */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <Card className="border-primary/40 bg-primary/5 shadow-card hover:shadow-elegant transition-all duration-200 hover:scale-[1.01] flex flex-col">
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
                <div className={cn("text-xl sm:text-2xl font-bold text-primary", blurClass)}>
                  {formatCurrency(data.total_balance)}
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
                        <linearGradient id="cashGradientPage" x1="0" y1="0" x2="0" y2="1">
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
                              <p className={cn("text-primary font-medium", blurClass)}>{formatCurrency(val)}</p>
                            </div>
                          );
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        fill="url(#cashGradientPage)"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <CashFlowCard
              title="Receitas Realizado"
              value={data.realized_income}
              icon={ArrowDownLeft}
              subtitle="Dinheiro que já entrou no mês"
              iconClassName="text-success"
              valueClassName="text-success"
              blurred={valuesHidden}
            />
            <CashFlowCard
              title="Despesas Realizado"
              value={data.realized_expenses}
              icon={ArrowUpRight}
              subtitle="Dinheiro que já saiu no mês"
              iconClassName="text-destructive"
              valueClassName="text-destructive"
              blurred={valuesHidden}
            />
            <CashFlowCard
              title="Fluxo Líquido Atual"
              value={data.net_flow}
              icon={isNetFlowNegative ? TrendingDown : TrendingUp}
              subtitle={valuesHidden ? undefined : `${formatCurrency(data.realized_income)} − ${formatCurrency(data.realized_expenses)}`}
              iconClassName={isNetFlowNegative ? 'text-destructive' : 'text-success'}
              valueClassName={isNetFlowNegative ? 'text-destructive' : 'text-success'}
              blurred={valuesHidden}
            />
          </div>

          {/* Linha 3: Projeção / Não Realizado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <CashFlowCard
              title="Contas a Receber"
              value={data.receivables_30d}
              icon={ArrowDownLeft}
              subtitle="Previsto para entrar (não realizado)"
              iconClassName="text-success"
              valueClassName="text-success"
              blurred={valuesHidden}
            />
            <CashFlowCard
              title="Contas a Pagar"
              value={data.payables_30d}
              icon={ArrowUpRight}
              subtitle="Compromissos pendentes (não realizado)"
              iconClassName="text-destructive"
              valueClassName="text-destructive"
              blurred={valuesHidden}
            />
            <CashFlowCard
              title="Saldo Projetado (Fim do Mês)"
              value={data.projected_balance}
              icon={Target}
              subtitle="Saldo + Receber − Pagar"
              cardClassName={cn(
                'border-primary/40 bg-primary/5',
                isProjectedNegative && 'border-destructive/40 bg-destructive/5'
              )}
              iconClassName={isProjectedNegative ? 'text-destructive' : 'text-primary'}
              valueClassName={isProjectedNegative ? 'text-destructive' : 'text-primary'}
              blurred={valuesHidden}
            />
          </div>
        </div>
      )}
    </ResponsiveContainer>
  );
}
