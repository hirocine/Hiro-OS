import { BarChart3, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEquipment } from '@/hooks/useEquipment';
import { useProjects } from '@/hooks/useProjects';

export default function Reports() {
  const { stats: equipmentStats, loading: equipmentLoading } = useEquipment();
  const { stats: projectStats, loading: projectLoading } = useProjects();

  const loading = equipmentLoading || projectLoading;

  if (loading) {
    return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-96 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Calculate utilization percentages
  const cameraUtilization = equipmentStats.byCategory.camera > 0 
    ? Math.round((equipmentStats.inUse / equipmentStats.byCategory.camera) * 100) 
    : 0;
  const audioUtilization = equipmentStats.byCategory.audio > 0 
    ? Math.round((equipmentStats.inUse / equipmentStats.byCategory.audio) * 100) 
    : 0;
  const lightingUtilization = equipmentStats.byCategory.lighting > 0 
    ? Math.round((equipmentStats.inUse / equipmentStats.byCategory.lighting) * 100) 
    : 0;

  const overallUtilization = equipmentStats.total > 0 
    ? Math.round((equipmentStats.inUse / equipmentStats.total) * 100) 
    : 0;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          Análises e insights sobre o inventário de equipamentos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Utilização por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Câmeras ({equipmentStats.byCategory.camera})</span>
                <span className="text-sm text-muted-foreground">{cameraUtilization}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3">
                <div className="bg-primary h-3 rounded-full transition-all duration-300" style={{ width: `${cameraUtilization}%` }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Equipamentos de Áudio ({equipmentStats.byCategory.audio})</span>
                <span className="text-sm text-muted-foreground">{audioUtilization}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3">
                <div className="bg-accent h-3 rounded-full transition-all duration-300" style={{ width: `${audioUtilization}%` }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Iluminação ({equipmentStats.byCategory.lighting})</span>
                <span className="text-sm text-muted-foreground">{lightingUtilization}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3">
                <div className="bg-success h-3 rounded-full transition-all duration-300" style={{ width: `${lightingUtilization}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendências do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gradient-card rounded-lg">
                <div>
                  <p className="font-medium">Projetos Ativos</p>
                  <p className="text-sm text-muted-foreground">Em andamento</p>
                </div>
                <span className="text-2xl font-bold text-primary">{projectStats.active}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gradient-card rounded-lg">
                <div>
                  <p className="font-medium">Taxa de Utilização</p>
                  <p className="text-sm text-muted-foreground">Equipamentos em uso</p>
                </div>
                <span className="text-2xl font-bold text-success">{overallUtilization}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas e Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-warning bg-warning/10 p-4 rounded-r-lg">
              <h4 className="font-medium">Equipamentos em Manutenção</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {equipmentStats.maintenance} equipamentos em manutenção
              </p>
            </div>
            
            <div className="border-l-4 border-success bg-success/10 p-4 rounded-r-lg">
              <h4 className="font-medium">Equipamentos Disponíveis</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {equipmentStats.available} equipamentos disponíveis para uso
              </p>
            </div>
            
            <div className="border-l-4 border-primary bg-primary/10 p-4 rounded-r-lg">
              <h4 className="font-medium">Equipamentos em Projetos</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {equipmentStats.total - equipmentStats.available - equipmentStats.maintenance} equipamentos em uso em projetos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}