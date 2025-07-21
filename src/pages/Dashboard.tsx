import { StatsCard } from '@/components/Dashboard/StatsCard';
import { useEquipment } from '@/hooks/useEquipment';
import { Package, CheckCircle, Clock, AlertTriangle, Camera, Headphones, Lightbulb, Wrench } from 'lucide-react';

export default function Dashboard() {
  const { stats } = useEquipment();

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
      title: 'Em Uso',
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
    <div className="container mx-auto p-6 space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do inventário de equipamentos audiovisuais
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat, index) => (
          <div key={stat.title} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
            <StatsCard {...stat} />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Equipamentos por Categoria</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categoryStats.map((stat, index) => (
            <div key={stat.title} className="animate-slide-up" style={{ animationDelay: `${(index + 4) * 100}ms` }}>
              <StatsCard {...stat} />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-card rounded-lg p-6 shadow-elegant">
        <h2 className="text-xl font-semibold mb-4">Resumo Financeiro</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Valor Total do Inventário</p>
            <p className="text-2xl font-bold text-primary">R$ 78.300,00</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Equipamentos Disponíveis</p>
            <p className="text-2xl font-bold text-success">R$ 52.800,00</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Em Uso/Manutenção</p>
            <p className="text-2xl font-bold text-warning">R$ 25.500,00</p>
          </div>
        </div>
      </div>
    </div>
  );
}