import { StatsCard } from '@/components/Dashboard/StatsCard';
import { useEquipment } from '@/hooks/useEquipment';
import { useNotifications } from '@/hooks/useNotifications';
import { Package, CheckCircle, Clock, AlertTriangle, Camera, Headphones, Lightbulb, Wrench } from 'lucide-react';

export default function Dashboard() {
  const { stats, allEquipment } = useEquipment();
  
  // Initialize notifications
  useNotifications();

  // Calculate financial stats
  const totalInventoryValue = allEquipment.reduce((sum, item) => sum + (item.value || 0), 0);
  const totalDepreciatedValue = allEquipment.reduce((sum, item) => sum + (item.depreciatedValue || item.value || 0), 0);

  // Calculate equipment by age
  const today = new Date();
  const equipmentByAge = allEquipment.reduce((acc, item) => {
    if (item.purchaseDate) {
      const purchaseDate = new Date(item.purchaseDate);
      const ageInYears = (today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      
      if (ageInYears >= 3) acc.over3Years++;
      else if (ageInYears >= 2) acc.over2Years++;
      else if (ageInYears >= 1) acc.over1Year++;
    }
    return acc;
  }, { over1Year: 0, over2Years: 0, over3Years: 0 });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const mainStats = [
    {
      title: 'Total de Equipamentos',
      value: stats.total,
      icon: Package,
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Disponíveis',
      value: stats.available,
      icon: CheckCircle,
      trend: { value: 8, isPositive: true }
    },
    {
      title: 'Gravação',
      value: stats.inUse,
      icon: Clock,
      trend: { value: 5, isPositive: false }
    },
    {
      title: 'Em Manutenção',
      value: stats.maintenance,
      icon: AlertTriangle,
      trend: { value: 2, isPositive: false }
    }
  ];

  const categoryStats = [
    {
      title: 'Câmeras',
      value: stats.byCategory.camera || 0,
      icon: Camera
    },
    {
      title: 'Equipamentos de Áudio',
      value: stats.byCategory.audio || 0,
      icon: Headphones
    },
    {
      title: 'Iluminação',
      value: stats.byCategory.lighting || 0,
      icon: Lightbulb
    },
    {
      title: 'Acessórios',
      value: stats.byCategory.accessories || 0,
      icon: Wrench
    }
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do inventário de equipamentos audiovisuais
        </p>
      </div>

      {/* Financial Summary */}
      <div className="bg-gradient-card rounded-lg p-4 lg:p-6 shadow-elegant">
        <h2 className="text-lg lg:text-xl font-semibold mb-4 lg:mb-6">Resumo Financeiro</h2>
        
        {/* Financial Values */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-background/50 rounded-lg border border-border/20">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-primary" />
              <p className="text-xs md:text-sm text-muted-foreground font-medium">Valor Total do Inventário</p>
            </div>
            <p className="text-lg md:text-xl lg:text-2xl font-bold text-primary">{formatCurrency(totalInventoryValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">Valor pago original</p>
          </div>
          <div className="p-4 bg-background/50 rounded-lg border border-border/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-xs md:text-sm text-muted-foreground font-medium">Valor Total Real</p>
            </div>
            <p className="text-lg md:text-xl lg:text-2xl font-bold text-destructive">{formatCurrency(totalDepreciatedValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">Com depreciação aplicada</p>
          </div>
        </div>

        {/* Equipment Age Analysis */}
        <div className="border-t border-border/20 pt-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Análise por Idade dos Equipamentos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-background/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-warning" />
                <p className="text-xs text-muted-foreground font-medium">Mais de 1 ano</p>
              </div>
              <p className="text-base md:text-lg font-bold text-warning">{equipmentByAge.over1Year}</p>
              <p className="text-xs text-muted-foreground">equipamentos</p>
            </div>
            <div className="p-3 bg-background/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-warning" />
                <p className="text-xs text-muted-foreground font-medium">Mais de 2 anos</p>
              </div>
              <p className="text-base md:text-lg font-bold text-warning">{equipmentByAge.over2Years}</p>
              <p className="text-xs text-muted-foreground">equipamentos</p>
            </div>
            <div className="p-3 bg-background/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <p className="text-xs text-muted-foreground font-medium">Mais de 3 anos</p>
              </div>
              <p className="text-base md:text-lg font-bold text-destructive">{equipmentByAge.over3Years}</p>
              <p className="text-xs text-muted-foreground">equipamentos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {mainStats.map((stat, index) => (
          <div key={stat.title} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
            <StatsCard {...stat} />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Equipamentos por Categoria</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {categoryStats.map((stat, index) => (
            <div key={stat.title} className="animate-slide-up" style={{ animationDelay: `${(index + 4) * 100}ms` }}>
              <StatsCard {...stat} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
