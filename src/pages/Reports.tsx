import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Package, AlertTriangle, Clock, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { useEquipment } from '@/hooks/useEquipment';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';

export default function Reports() {
  const { stats: equipmentStats, loading: equipmentLoading, allEquipment } = useEquipment();
  const { stats: projectStats, loading: projectLoading } = useProjects();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const loading = equipmentLoading || projectLoading;

  useEffect(() => {
    if (!loading && allEquipment.length > 0) {
      setLastUpdate(new Date());
    }
  }, [loading, allEquipment.length]);

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'agora mesmo';
    if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)} horas`;
    return `há ${Math.floor(diffInSeconds / 86400)} dias`;
  };

  if (loading) {
    return (
      <ResponsiveContainer className="flex items-center justify-center min-h-[50vh]">
        <div className="space-y-4 text-center">
          <div className="h-8 w-48 bg-muted rounded animate-pulse mx-auto" />
          <div className="h-4 w-96 bg-muted rounded animate-pulse mx-auto" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </ResponsiveContainer>
    );
  }

  // Calculate utilization percentages - FIXED: use category-specific inUse counts
  const cameraUtilization = equipmentStats.byCategory.camera > 0 
    ? Math.round((equipmentStats.inUseByCategory.camera / equipmentStats.byCategory.camera) * 100) 
    : 0;
  const audioUtilization = equipmentStats.byCategory.audio > 0 
    ? Math.round((equipmentStats.inUseByCategory.audio / equipmentStats.byCategory.audio) * 100) 
    : 0;
  const lightingUtilization = equipmentStats.byCategory.lighting > 0 
    ? Math.round((equipmentStats.inUseByCategory.lighting / equipmentStats.byCategory.lighting) * 100) 
    : 0;

  const overallUtilization = equipmentStats.total > 0 
    ? Math.round((equipmentStats.inUse / equipmentStats.total) * 100) 
    : 0;


  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader 
        title="Relatórios" 
        subtitle={
          <span className="flex items-center gap-2">
            Análises e insights sobre o inventário de equipamentos
            {lastUpdate && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <span className="text-xs text-muted-foreground/70 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Atualizado {formatRelativeTime(lastUpdate)}
                </span>
              </>
            )}
          </span>
        }
        actions={
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        }
      />

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


      <Card className="shadow-card mt-4 md:mt-6">
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
    </ResponsiveContainer>
  );
}