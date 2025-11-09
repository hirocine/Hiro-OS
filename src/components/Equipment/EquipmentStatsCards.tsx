import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  Wrench,
  TrendingUp
} from 'lucide-react';
import { DashboardStats } from '@/types/equipment';
import { formatCurrency } from '@/lib/utils';

interface EquipmentStatsCardsProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

export function EquipmentStatsCards({ stats, isLoading }: EquipmentStatsCardsProps) {
  const statsCards = [
    {
      title: 'Total de Equipamentos',
      value: stats.total,
      icon: Package,
      description: `${stats.mainItems} principais, ${stats.accessories} acessórios`,
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
      title: 'Em Manutenção',
      value: stats.maintenance,
      icon: Wrench,
      description: stats.maintenance > 0 ? 'Requer atenção' : 'Tudo em ordem',
      trend: stats.maintenance === 0 ? 'Excelente' : 'Atenção',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[...Array(3)].map((_, i) => (
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                {stat.trend && (
                  <Badge 
                    variant={stat.trend === 'Atenção' ? 'warning' : 'secondary'} 
                    className="text-xs"
                  >
                    {stat.trend}
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}