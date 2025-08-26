import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  Wrench,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { DashboardStats } from '@/types/equipment';

interface EquipmentStatsCardsProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

export function EquipmentStatsCards({ stats, isLoading }: EquipmentStatsCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const statsCards = [
    {
      title: 'Total de Equipamentos',
      value: stats.total,
      icon: Package,
      description: `${stats.mainItems} principais, ${stats.accessories} acessórios`,
      trend: '+12% este mês',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Disponíveis',
      value: stats.available,
      icon: CheckCircle,
      description: `${Math.round((stats.available / stats.total) * 100)}% do total`,
      trend: 'Normal',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Em Uso',
      value: stats.inUse,
      icon: TrendingUp,
      description: `${Math.round((stats.inUse / stats.total) * 100)}% do total`,
      trend: stats.inUse > 0 ? 'Ativo' : 'Nenhum',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Em Manutenção',
      value: stats.maintenance,
      icon: Wrench,
      description: stats.maintenance > 0 ? 'Requer atenção' : 'Tudo em ordem',
      trend: stats.maintenance === 0 ? 'Excelente' : 'Atenção',
      color: stats.maintenance > 0 ? 'text-destructive' : 'text-success',
      bgColor: stats.maintenance > 0 ? 'bg-destructive/10' : 'bg-success/10',
    },
  ];

  const categoryStats = Object.entries(stats.byCategory)
    .filter(([_, count]) => count > 0)
    .sort(([_, a], [__, b]) => b - a);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-elegant transition-all duration-300 animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground mb-1">
                  {stat.value.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {stat.description}
                </p>
                <Badge 
                  variant={stat.trend === 'Atenção' ? 'warning' : 'secondary'} 
                  className="text-xs"
                >
                  {stat.trend}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Category Distribution */}
      {categoryStats.length > 0 && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Distribuição por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {categoryStats.map(([category, count]) => {
                const percentage = Math.round((count / stats.total) * 100);
                return (
                  <div 
                    key={category} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground capitalize truncate">
                        {category === 'camera' ? 'Câmeras' :
                         category === 'audio' ? 'Áudio' :
                         category === 'lighting' ? 'Iluminação' :
                         category === 'accessories' ? 'Acessórios' :
                         category === 'storage' ? 'Armazenamento' : category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {count} itens ({percentage}%)
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {count}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}