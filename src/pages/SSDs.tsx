import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Plus, Clock, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SSDKanbanBoard } from '@/components/SSD/SSDKanbanBoard';
import { AddSSDDialog } from '@/components/SSD/AddSSDDialog';
import { useSSDs } from '@/features/ssds';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer } from '@/components/ui/responsive-container';

const SSDs = () => {
  const { ssds, ssdsByStatus, ssdAllocations, loading, updateSSDStatus, updateSSDOrder, refetch } = useSSDs();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!loading && ssds.length > 0) {
      setLastUpdate(new Date());
    }
  }, [loading, ssds.length]);

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'agora mesmo';
    if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)} horas`;
    return `há ${Math.floor(diffInSeconds / 86400)} dias`;
  };

  const stats = useMemo(() => {
    const total = ssds.length;
    const totalCapacity = ssds.reduce((sum, ssd) => sum + (ssd.capacity || 0), 0);
    const available = ssdsByStatus.available.length;
    const inUse = ssdsByStatus.in_use.length;
    const loaned = ssdsByStatus.loaned.length;

    return { total, totalCapacity, available, inUse, loaned };
  }, [ssds, ssdsByStatus]);

  if (loading) {
    return (
      <ResponsiveContainer maxWidth="7xl">
        <PageHeader
          title="Controle de SSDs e HDs"
          subtitle="Gerencie seus SSDs e HDs de forma visual"
        />
        <div className="flex gap-4 mt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1">
              <Skeleton className="h-[400px] w-full" />
            </div>
          ))}
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader
        title="Controle de SSDs e HDs"
        subtitle={
          <span className="flex items-center gap-2">
            Gerencie seus SSDs e HDs de forma visual
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
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar SSD
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de SSDs/HDs</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCapacity.toFixed(0)} GB capacidade total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
            <div className="h-4 w-4 rounded-full bg-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.available}</div>
            <p className="text-xs text-muted-foreground">
              Prontos para uso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Projetos</CardTitle>
            <div className="h-4 w-4 rounded-full bg-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inUse}</div>
            <p className="text-xs text-muted-foreground">
              Alocados em projetos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emprestados</CardTitle>
            <div className="h-4 w-4 rounded-full bg-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.loaned}</div>
            <p className="text-xs text-muted-foreground">
              Fora do estoque
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <SSDKanbanBoard
          ssdsByStatus={ssdsByStatus}
          ssdAllocations={ssdAllocations}
          onStatusChange={updateSSDStatus}
          onReorder={updateSSDOrder}
          onUpdate={refetch}
        />
      </div>

      <AddSSDDialog 
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={refetch}
      />
    </ResponsiveContainer>
  );
};

export default SSDs;
