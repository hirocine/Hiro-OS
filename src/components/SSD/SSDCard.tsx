import { Equipment } from '@/types/equipment';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SSDStatus } from '@/hooks/useSSDs';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface SSDCardProps {
  ssd: Equipment;
  isDragging?: boolean;
  kanbanStatus?: SSDStatus;
  onClick?: () => void;
}

const getKanbanStatusVariant = (status: SSDStatus) => {
  switch (status) {
    case 'available':
      return 'success';
    case 'in_use':
      return 'warning';
    case 'loaned':
      return 'destructive';
  }
};

const getKanbanStatusLabel = (status: SSDStatus) => {
  switch (status) {
    case 'available':
      return 'Livre';
    case 'in_use':
      return 'Em uso (Interno)';
    case 'loaned':
      return 'Em uso (Externo)';
  }
};

export const SSDCard = ({ ssd, isDragging, kanbanStatus, onClick }: SSDCardProps) => {
  const [allocatedSpace, setAllocatedSpace] = useState(0);

  // Buscar alocações ao montar o componente
  useEffect(() => {
    const fetchAllocations = async () => {
      if (!ssd.id || !ssd.capacity) return;
      
      // Só busca se estiver em uso (interno ou externo)
      if (kanbanStatus !== 'in_use' && kanbanStatus !== 'loaned') return;
      
      try {
        const { data, error } = await supabase
          .from('ssd_allocations')
          .select('allocated_gb')
          .eq('ssd_id', ssd.id);

        if (error) throw error;
        
        const total = (data || []).reduce((sum, a) => sum + (a.allocated_gb || 0), 0);
        setAllocatedSpace(total);
      } catch (error) {
        logger.error('Failed to fetch SSD allocations', {
          module: 'ssd',
          data: { ssdId: ssd.id },
          error
        });
      }
    };

    fetchAllocations();
  }, [ssd.id, ssd.capacity, kanbanStatus]);

  // Calcular espaço livre
  const freeSpace = (ssd.capacity || 0) - allocatedSpace;
  const shouldShowFreeSpace = (kanbanStatus === 'in_use' || kanbanStatus === 'loaned') && ssd.capacity;
  
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 ease-out",
        !isDragging && "hover:shadow-elegant hover:scale-[1.02]",
        isDragging && "opacity-50",
        "motion-reduce:transition-none"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <HardDrive className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm truncate">
                  {ssd.name}
                </h4>
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {ssd.patrimonyNumber && (
                  <Badge 
                    variant="outline" 
                    className="shrink-0 text-[10px]"
                  >
                    #{ssd.patrimonyNumber}
                  </Badge>
                )}
                {shouldShowFreeSpace && (
                  <Badge 
                    variant="outline"
                    className="shrink-0 text-[10px]"
                  >
                    {freeSpace.toFixed(0)} GB de {ssd.capacity} GB
                  </Badge>
                )}
                {kanbanStatus && (
                  <Badge 
                    variant={getKanbanStatusVariant(kanbanStatus)}
                    className="shrink-0 text-[10px]"
                  >
                    {getKanbanStatusLabel(kanbanStatus)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
