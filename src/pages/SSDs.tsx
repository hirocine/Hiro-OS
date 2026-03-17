import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Clock, HardDrive, CheckCircle2, FolderOpen, Share2 } from 'lucide-react';
import { SSDKanbanBoard } from '@/components/SSD/SSDKanbanBoard';
import { useSSDs } from '@/features/ssds';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { formatRelativeTime } from '@/lib/utils';
import { StatsCard, StatsCardGrid, StatsCardSkeleton } from '@/components/ui/stats-card';

const SSDs = () => {
  const { ssds, ssdsByStatus, ssdAllocations, loading, updateSSDStatus, updateSSDOrder, refetch } = useSSDs();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!loading && ssds.length > 0) {
      setLastUpdate(new Date());
    }
  }, [loading, ssds.length]);

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
      <ResponsiveContainer maxWidth="7xl" className="animate-fade-in">
        <PageHeader
          title="Controle de SSDs e HDs"
          subtitle="Gerencie seus SSDs e HDs de forma visual"
        />

        <div className="mt-6">
          <StatsCardGrid columns={4}>
            {[1, 2, 3, 4].map(i => <StatsCardSkeleton key={i} />)}
          </StatsCardGrid>
        </div>

        {/* Kanban columns skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {[1, 2, 3].map((col) => (
            <div key={col} className="rounded-lg border bg-card p-4 space-y-3 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
              {Array.from({ length: col === 1 ? 3 : 2 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-background p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex justify-between items-center pt-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </ResponsiveContainer>
    );
  }

  const statsCards = [
    { title: 'Total de SSDs/HDs', value: stats.total, icon: HardDrive, color: 'text-primary', bgColor: 'bg-primary/10', borderColor: 'border-l-primary', description: `${stats.totalCapacity.toFixed(0)} GB capacidade total` },
    { title: 'Disponíveis', value: stats.available, icon: CheckCircle2, color: 'text-success', bgColor: 'bg-success/10', borderColor: 'border-l-success', description: 'Prontos para uso' },
    { title: 'Em Projetos', value: stats.inUse, icon: FolderOpen, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-l-blue-500', description: 'Alocados em projetos' },
    { title: 'Emprestados', value: stats.loaned, icon: Share2, color: 'text-warning', bgColor: 'bg-warning/10', borderColor: 'border-l-warning', description: 'Fora do estoque' },
  ];

  return (
    <ResponsiveContainer maxWidth="7xl" className="animate-fade-in">
      <PageHeader
        title="Controle de SSDs e HDs"
        subtitle={
          <>
            Gerencie seus SSDs e HDs de forma visual. Cadastre novos itens pelo Inventário.
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

      <div className="mt-6">
        <StatsCardGrid columns={4}>
          {statsCards.map(card => <StatsCard key={card.title} {...card} />)}
        </StatsCardGrid>
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
    </ResponsiveContainer>
  );
};

export default SSDs;
