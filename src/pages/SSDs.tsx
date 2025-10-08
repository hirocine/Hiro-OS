import { PageHeader } from '@/components/ui/page-header';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SSDKanbanBoard } from '@/components/SSD/SSDKanbanBoard';
import { useSSDs } from '@/hooks/useSSDs';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer } from '@/components/ui/responsive-container';

const SSDs = () => {
  const { ssdsByStatus, loading, updateSSDStatus, updateSSDOrder, refetch } = useSSDs();

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
        subtitle="Gerencie seus SSDs e HDs de forma visual"
        actions={
          <Button>
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
          onUpdate={refetch}
        />
      </div>
    </ResponsiveContainer>
  );
};

export default SSDs;
