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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
}

function CashFlowCard({
  title,
  value,
  icon: Icon,
  subtitle,
  iconClassName,
  valueClassName,
  cardClassName,
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
        <div className={cn('text-2xl font-bold', valueClassName)}>
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
  const { data, loading } = useCashFlowData();

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <CashFlowCard
            title="Saldo Total Disponível"
            value={data.total_balance}
            icon={Wallet}
            subtitle="Soma de todas as contas bancárias"
          />

          <CashFlowCard
            title="Fluxo Líquido do Mês"
            value={data.net_flow}
            icon={isNetFlowNegative ? TrendingDown : TrendingUp}
            subtitle={`Recebido: ${formatCurrency(data.monthly_income)} · Pago: ${formatCurrency(data.monthly_expenses)}`}
            iconClassName={isNetFlowNegative ? 'text-destructive' : 'text-success'}
            valueClassName={isNetFlowNegative ? 'text-destructive' : 'text-success'}
          />

          <CashFlowCard
            title="Saldo Projetado (Fim do Mês)"
            value={data.projected_balance}
            icon={Target}
            subtitle="Saldo Atual + Receber − Pagar"
            cardClassName={cn(
              'border-primary/40 bg-primary/5',
              isProjectedNegative && 'border-destructive/40 bg-destructive/5'
            )}
            iconClassName={isProjectedNegative ? 'text-destructive' : 'text-primary'}
            valueClassName={isProjectedNegative ? 'text-destructive' : 'text-primary'}
          />

          <CashFlowCard
            title="Contas a Receber (30 dias)"
            value={data.receivables_30d}
            icon={ArrowDownLeft}
            subtitle="Dinheiro previsto para entrar"
            iconClassName="text-success"
            valueClassName="text-success"
          />

          <CashFlowCard
            title="Contas a Pagar (30 dias)"
            value={data.payables_30d}
            icon={ArrowUpRight}
            subtitle="Compromissos a honrar"
            iconClassName="text-warning"
            valueClassName="text-warning"
          />
        </div>
      )}
    </ResponsiveContainer>
  );
}
