import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCapexData } from '@/hooks/useCapexData';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  Landmark, TrendingDown, ArrowDownRight, Camera, Monitor, Building2, CalendarPlus, BarChart3, Layers
} from 'lucide-react';

function CapexCard({ title, icon: Icon, value, iconClassName, valueClassName, subtitle, className }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  iconClassName?: string;
  valueClassName?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <Card className={cn("shadow-card hover:shadow-elegant transition-all duration-200 hover:scale-[1.02]", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon className={cn("h-4 w-4", iconClassName)} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("text-base sm:text-lg lg:text-xl font-bold", valueClassName)}>
          {value}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export default function Capex() {
  const { isAdmin, roleLoading } = useAuthContext();
  const { data, loading } = useCapexData();

  if (!roleLoading && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (roleLoading || loading) {
    return (
      <ResponsiveContainer maxWidth="7xl">
        <PageHeader title="Gestão de CAPEX (Ativos)" subtitle="Carregando dados..." />
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
          </div>
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer maxWidth="7xl" className="animate-fade-in">
      <PageHeader
        title="Gestão de CAPEX (Ativos)"
        subtitle="Visão patrimonial e investimentos em ativos fixos"
      />

      <div className="space-y-6 lg:space-y-8">
        {/* Linha 1: Resumo Contábil */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">Resumo Contábil</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CapexCard
              title="Total Investido Patrimonial"
              icon={Landmark}
              value={formatCurrency(data.total_invested)}
              iconClassName="text-foreground"
              valueClassName="text-foreground"
              subtitle="Valor bruto acumulado de compras"
            />
            <CapexCard
              title="Total Patrimonial Atual"
              icon={TrendingDown}
              value={formatCurrency(data.total_current)}
              iconClassName="text-primary"
              valueClassName="text-primary"
              subtitle="Valor líquido (Investido − Depreciação)"
            />
            <CapexCard
              title="Depreciação Mensal"
              icon={ArrowDownRight}
              value={formatCurrency(data.monthly_depreciation)}
              iconClassName="text-destructive"
              valueClassName="text-destructive"
              subtitle="Custo mensal de desvalorização"
            />
          </div>
        </section>

        {/* Linha 2: Segmentação Estratégica */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">Segmentação Estratégica</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CapexCard
              title="Equipamentos AV"
              icon={Camera}
              value={formatCurrency(data.av_equipment)}
              iconClassName="text-primary"
              valueClassName="text-primary"
              subtitle="Câmeras, Lentes e Luz"
            />
            <CapexCard
              title="Tecnologia & Post"
              icon={Monitor}
              value={formatCurrency(data.tech_post)}
              iconClassName="text-primary"
              valueClassName="text-primary"
              subtitle="Ilhas de Edição e Armazenamento"
            />
            <CapexCard
              title="Imobilizado Geral"
              icon={Building2}
              value={formatCurrency(data.general_assets)}
              iconClassName="text-muted-foreground"
              valueClassName="text-muted-foreground"
              subtitle="Móveis, infraestrutura e outros"
            />
            <CapexCard
              title="CAPEX 2026"
              icon={CalendarPlus}
              value={formatCurrency(data.capex_current_year)}
              iconClassName="text-success"
              valueClassName="text-success"
              subtitle="Total investido no ano corrente"
              className="border-success/30"
            />
          </div>
        </section>
      </div>
    </ResponsiveContainer>
  );
}
