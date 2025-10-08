import { PageHeader } from '@/components/ui/page-header';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SSDKanbanBoard } from '@/components/SSD/SSDKanbanBoard';
import { useSSDs } from '@/hooks/useSSDs';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { HOVER_EFFECTS } from '@/lib/animations';

const SSDs = () => {
  const { ssdsByStatus, loading, updateSSDStatus, updateSSDOrder } = useSSDs();

  if (loading) {
    return (
      <ResponsiveContainer maxWidth="7xl">
        <PageHeader
          title="Controle de SSDs e HDs"
          subtitle="Gerencie seus SSDs e HDs de forma visual"
        />
        <div className="flex gap-4 mt-6">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="flex-1 animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <Skeleton className="h-[400px] w-full animate-pulse" />
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
        subtitle="Gerencie seus SSDs e HDs de forma visual"
        actions={
          <Button className={HOVER_EFFECTS.button}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar SSD
          </Button>
        }
      />
      <div className="mt-6">
        <SSDKanbanBoard
          ssdsByStatus={ssdsByStatus}
          onStatusChange={updateSSDStatus}
          onReorder={updateSSDOrder}
        />
      </div>
    </ResponsiveContainer>
  );
};

export default SSDs;
