import { StatsCard } from '@/components/Dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { useEquipment } from '@/features/equipment';
import { useNotifications } from '@/hooks/useNotifications';
import { Package, CheckCircle, Clock, AlertTriangle, Camera, Headphones, Lightbulb, Wrench, BarChart3 } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { StatsCardSkeleton } from '@/components/ui/skeleton-loaders';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate, Navigate } from 'react-router-dom';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { useAuthContext } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { isAdmin, roleLoading } = useAuthContext();
  const { stats, allEquipment, loading } = useEquipment();
  const navigate = useNavigate();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Initialize notifications
  useNotifications();

  // Update timestamp when data is loaded
  useEffect(() => {
    if (!loading && allEquipment.length > 0) {
      setLastUpdate(new Date());
    }
  }, [loading, allEquipment.length]);

  // Calculate financial stats with useMemo for performance
  const totalInventoryValue = useMemo(() => 
    allEquipment.reduce((sum, item) => sum + (item.value || 0), 0),
    [allEquipment]
  );

  const totalDepreciatedValue = useMemo(() => 
    allEquipment.reduce((sum, item) => sum + (item.depreciatedValue || item.value || 0), 0),
    [allEquipment]
  );

  // Calculate equipment by age with useMemo (cumulative logic)
  const equipmentByAge = useMemo(() => {
    const today = new Date();
    return allEquipment.reduce((acc, item) => {
      if (item.purchaseDate) {
        const purchaseDate = new Date(item.purchaseDate);
        const ageInYears = (today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        
        // Cumulative logic: each category includes previous ones
        if (ageInYears >= 1) acc.over1Year++;
        if (ageInYears >= 2) acc.over2Years++;
        if (ageInYears >= 3) acc.over3Years++;
      }
      return acc;
    }, { over1Year: 0, over2Years: 0, over3Years: 0 });
  }, [allEquipment]);

  const mainStats = useMemo(() => [
    {
      title: 'Total de Equipamentos',
      value: stats.total,
      icon: Package
    },
    {
      title: 'Disponíveis',
      value: stats.available,
      icon: CheckCircle
    },
    {
      title: 'Em Manutenção',
      value: stats.maintenance,
      icon: AlertTriangle
    }
  ], [stats]);

  // formatRelativeTime imported from @/lib/utils

  // Proteção de rota: apenas admins podem acessar
  if (!roleLoading && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Loading state (inclui roleLoading)
  if (roleLoading || loading) {
    return (
      <ResponsiveContainer maxWidth="7xl">
        <PageHeader 
          title="Dashboard" 
          subtitle="Visão geral do inventário de equipamentos audiovisuais"
        />
        
        <div className="space-y-6 lg:space-y-8">
          {/* Skeleton do Resumo Financeiro */}
          <div className="bg-gradient-card rounded-lg p-4 lg:p-6 shadow-elegant">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="border-t border-border/20 pt-4">
              <Skeleton className="h-4 w-64 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
              </div>
            </div>
          </div>

          {/* Skeleton Visão Geral */}
          <div>
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {[...Array(3)].map((_, i) => <StatsCardSkeleton key={i} />)}
            </div>
          </div>

          {/* Skeleton Categorias */}
          <div>
            <Skeleton className="h-8 w-64 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {[...Array(3)].map((_, i) => <StatsCardSkeleton key={i} />)}
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    );
  }

  // Empty state
  if (allEquipment.length === 0) {
    return (
      <ResponsiveContainer maxWidth="7xl">
        <PageHeader 
          title="Dashboard" 
          subtitle="Visão geral do inventário de equipamentos audiovisuais"
        />
        <EmptyState
          icon={Package}
          title="Nenhum equipamento cadastrado"
          description="Comece adicionando seu primeiro equipamento ao inventário para visualizar estatísticas e análises."
          action={{
            label: "Adicionar Equipamento",
            onClick: () => navigate('/inventario/novo')
          }}
        />
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer maxWidth="7xl" className="animate-fade-in">
      <PageHeader 
        title="Dashboard" 
        subtitle={
          <>
            Visão geral do inventário de equipamentos audiovisuais
            {lastUpdate && (
              <span className="text-muted-foreground/50"> • </span>
            )}
            {lastUpdate && (
              <span className="text-xs text-muted-foreground/70 inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Atualizado {formatRelativeTime(lastUpdate)}
              </span>
            )}
          </>
        }
      />

      <div className="space-y-6 lg:space-y-8">
        {/* Seção: Resumo Financeiro */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-xl lg:text-2xl font-semibold">Resumo Financeiro</h2>
          </div>
          <div className="bg-gradient-card rounded-lg p-4 lg:p-6 shadow-elegant">
        
            {/* Financial Values */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-background/50 rounded-lg border-2 border-primary/20 hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-primary" aria-hidden="true" />
                  <p className="text-xs md:text-sm text-muted-foreground font-medium">Valor Total do Inventário</p>
                </div>
                <p className="text-lg md:text-xl lg:text-2xl font-bold text-primary" aria-label={`Valor total do inventário: ${formatCurrency(totalInventoryValue)}`}>
                  {formatCurrency(totalInventoryValue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Valor pago original</p>
              </div>
              <div className="p-4 bg-background/50 rounded-lg border-2 border-destructive/20 hover:border-destructive/40 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />
                  <p className="text-xs md:text-sm text-muted-foreground font-medium">Valor Total Real</p>
                </div>
                <p className="text-lg md:text-xl lg:text-2xl font-bold text-destructive" aria-label={`Valor total real com depreciação: ${formatCurrency(totalDepreciatedValue)}`}>
                  {formatCurrency(totalDepreciatedValue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Com depreciação aplicada</p>
              </div>
            </div>

            {/* Equipment Age Analysis */}
            <div className="border-t border-border/20 pt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Análise por Idade dos Equipamentos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="shadow-card hover:shadow-elegant transition-all duration-200 hover:scale-[1.02]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Mais de 1 ano
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-muted-foreground" aria-label={`${equipmentByAge.over1Year} equipamentos com mais de 1 ano`}>
                      {equipmentByAge.over1Year}
                    </div>
                    <p className="text-xs text-muted-foreground">equipamentos</p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-card hover:shadow-elegant transition-all duration-200 hover:scale-[1.02]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Mais de 2 anos
                    </CardTitle>
                    <Clock className="h-4 w-4 text-warning" aria-hidden="true" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-warning" aria-label={`${equipmentByAge.over2Years} equipamentos com mais de 2 anos`}>
                      {equipmentByAge.over2Years}
                    </div>
                    <p className="text-xs text-muted-foreground">equipamentos</p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-card hover:shadow-elegant transition-all duration-200 hover:scale-[1.02]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Mais de 3 anos
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive" aria-label={`${equipmentByAge.over3Years} equipamentos com mais de 3 anos`}>
                      {equipmentByAge.over3Years}
                    </div>
                    <p className="text-xs text-muted-foreground">equipamentos</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Seção: Visão Geral */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-xl lg:text-2xl font-semibold">Visão Geral</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {mainStats.map((stat, index) => (
              <div key={stat.title} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <StatsCard {...stat} />
              </div>
            ))}
          </div>
        </section>

      </div>
    </ResponsiveContainer>
  );
}
