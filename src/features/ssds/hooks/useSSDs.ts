import { useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Equipment } from '@/types/equipment';
import { useToast } from '@/hooks/use-toast';
import { arrayMove } from '@dnd-kit/sortable';
import { useAuthContext } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/queryClient';

export type SSDStatus = 'available' | 'in_use' | 'loaned';

export interface SSDsByStatus {
  available: Equipment[];
  in_use: Equipment[];
  loaned: Equipment[];
}

export interface SSDAllocation {
  ssd_id: string;
  allocated_gb: number;
}

export interface SSDAllocationsMap {
  [ssdId: string]: number;
}

// Helper function to detect if an item is a drive (SSD/HD)
const isDrive = (item: any): boolean => {
  const searchText = `${item.subcategory || ''} ${item.name || ''} ${item.custom_category || ''}`.toLowerCase();
  
  // Must contain ssd or hd
  const hasDrive = searchText.includes('ssd') || searchText.includes('hd') || searchText.includes('hard');
  
  // Exclude cards, readers, and false positives like "full hd"
  const isExcluded = searchText.includes('card') || 
                     searchText.includes('cartão') || 
                     searchText.includes('reader') || 
                     searchText.includes('leitor') ||
                     searchText.includes('full hd') ||
                     searchText.includes('fullhd');
  
  return hasDrive && !isExcluded;
};

// Fetch SSDs function
const fetchSSDs = async (): Promise<{ ssds: Equipment[], allocations: SSDAllocationsMap }> => {
  const { data, error } = await supabase
    .from('equipments')
    .select('*')
    .eq('category', 'Armazenamento')
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('name');

  if (error) throw error;
    
  // Filter client-side for drives only
  const driveData = (data || []).filter(isDrive);
  
  // Transform data to match Equipment interface
  const transformedData = driveData.map(item => ({
    ...item,
    itemType: item.item_type as 'main' | 'accessory',
    simplifiedStatus: item.simplified_status as 'available' | 'in_project',
    currentLoanId: item.current_loan_id,
    currentBorrower: item.current_borrower,
    lastLoanDate: item.last_loan_date,
    serialNumber: item.serial_number,
    purchaseDate: item.purchase_date,
    lastMaintenance: item.last_maintenance,
    patrimonyNumber: item.patrimony_number,
    depreciatedValue: item.depreciated_value,
    receiveDate: item.receive_date,
    customCategory: item.custom_category,
    parentId: item.parent_id,
    displayOrder: item.display_order,
    ssdNumber: item.ssd_number
  })) as Equipment[];

  // Fetch all allocations in batch
  const allocationsMap: SSDAllocationsMap = {};
  if (transformedData.length > 0) {
    const { data: allocationsData, error: allocError } = await supabase
      .from('ssd_allocations')
      .select('ssd_id, allocated_gb')
      .in('ssd_id', transformedData.map(ssd => ssd.id));

    if (!allocError && allocationsData) {
      allocationsData.forEach((alloc: SSDAllocation) => {
        if (!allocationsMap[alloc.ssd_id]) {
          allocationsMap[alloc.ssd_id] = 0;
        }
        allocationsMap[alloc.ssd_id] += alloc.allocated_gb || 0;
      });
    }
  }

  return { ssds: transformedData, allocations: allocationsMap };
};

export const useSSDs = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { logAuditEntry } = useAuthContext();

  // Query for fetching SSDs
  const { data, isLoading: loading } = useQuery({
    queryKey: queryKeys.ssds.all,
    queryFn: fetchSSDs,
  });

  const ssds = data?.ssds || [];
  const ssdAllocations = data?.allocations || {};

  // Real-time subscription
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;
    
    // Subscribe to realtime changes for storage equipment
    const channel = supabase
      .channel('storage-equipment-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipments',
          filter: 'category=eq.Armazenamento'
        },
        () => {
          // Debounce realtime updates to avoid multiple rapid refetches
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.ssds.all });
          }, 300);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const ssdsByStatus = useMemo<SSDsByStatus>(() => {
    // Para SSDs/HDs, o status é baseado EXCLUSIVAMENTE no Kanban (display_order)
    const result: SSDsByStatus = {
      available: [],
      in_use: [],
      loaned: [],
    };

    ssds.forEach(ssd => {
      // Determinar status baseado na posição do Kanban (display_order)
      if (ssd.displayOrder !== undefined) {
        if (ssd.displayOrder < 1000) {
          result.available.push(ssd);
        } else if (ssd.displayOrder < 2000) {
          result.in_use.push(ssd);
        } else {
          result.loaned.push(ssd);
        }
      } else {
        // Se não tem displayOrder, vai para Available por padrão
        result.available.push(ssd);
      }
    });

    // Ordenar cada array por displayOrder primeiro, depois por nome
    const sortByOrder = (a: Equipment, b: Equipment) => {
      if (a.displayOrder === undefined && b.displayOrder === undefined) return a.name.localeCompare(b.name);
      if (a.displayOrder === undefined) return 1;
      if (b.displayOrder === undefined) return -1;
      return a.displayOrder - b.displayOrder;
    };

    result.available.sort(sortByOrder);
    result.in_use.sort(sortByOrder);
    result.loaned.sort(sortByOrder);

    return result;
  }, [ssds]);

  // Mutation for updating SSD status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ssdId, newStatus }: { ssdId: string, newStatus: SSDStatus }) => {
      // Determinar o novo display_order baseado no status
      let newDisplayOrder: number;
      if (newStatus === 'available') {
        newDisplayOrder = 0;
      } else if (newStatus === 'in_use') {
        newDisplayOrder = 1000;
      } else {
        newDisplayOrder = 2000;
      }
      
      const oldSsd = ssds.find(s => s.id === ssdId);

      // Update only display_order in database
      const { error } = await supabase
        .from('equipments')
        .update({ display_order: newDisplayOrder })
        .eq('id', ssdId);

      if (error) throw error;
      
      // Log de auditoria
      const getStatusFromOrder = (order?: number): SSDStatus => {
        if (!order || order < 1000) return 'available';
        if (order >= 1000 && order < 2000) return 'in_use';
        return 'loaned';
      };
      
      await logAuditEntry(
        'update_ssd_status',
        'equipments',
        ssdId,
        oldSsd ? { 
          display_order: oldSsd.displayOrder,
          status: getStatusFromOrder(oldSsd.displayOrder)
        } : undefined,
        {
          display_order: newDisplayOrder,
          status: newStatus
        }
      );
      
      return { ssdId, newDisplayOrder };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ssds.all });
      toast({
        title: "Status atualizado",
        description: "Status do SSD atualizado com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do SSD.",
        variant: "destructive"
      });
    },
  });

  // Mutation for updating SSD order
  const updateOrderMutation = useMutation({
    mutationFn: async ({ ssdId, newStatus, targetIndex }: { ssdId: string, newStatus: SSDStatus, targetIndex: number }) => {
      const ssdToUpdate = ssds.find(s => s.id === ssdId);
      if (!ssdToUpdate) throw new Error('SSD not found');

      // Determinar base display_order para cada coluna
      const baseDisplayOrder = newStatus === 'available' ? 0 : newStatus === 'in_use' ? 1000 : 2000;

      // Get target column SSDs
      const targetColumnKey = newStatus;
      const targetColumnSsds = [...ssdsByStatus[targetColumnKey]];
      
      // Find which column the SSD is currently in
      const oldStatus: SSDStatus = 
        (ssdToUpdate.displayOrder || 0) < 1000 ? 'available' :
        (ssdToUpdate.displayOrder || 0) < 2000 ? 'in_use' : 'loaned';
      
      let reorderedSsds: Equipment[];
      if (oldStatus !== newStatus) {
        // Moving to different column - insert at target position
        const updatedSsd = { ...ssdToUpdate };
        reorderedSsds = [...targetColumnSsds];
        reorderedSsds.splice(targetIndex, 0, updatedSsd);
      } else {
        // Reordering within same column
        const currentIndex = targetColumnSsds.findIndex(s => s.id === ssdId);
        reorderedSsds = arrayMove(targetColumnSsds, currentIndex, targetIndex);
      }

      // Recalculate display_order for all SSDs in target column
      const updates = reorderedSsds.map((ssd, index) => ({
        id: ssd.id,
        display_order: baseDisplayOrder + index
      }));

      // Batch update all affected SSDs
      for (const update of updates) {
        const { error } = await supabase
          .from('equipments')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) throw error;
      }

      // Log de auditoria apenas se mudou de coluna
      const oldSsd = ssds.find(s => s.id === ssdId);
      const getStatusFromOrder = (order?: number): SSDStatus => {
        if (!order || order < 1000) return 'available';
        if (order >= 1000 && order < 2000) return 'in_use';
        return 'loaned';
      };
      
      const oldStatusForLog = oldSsd ? getStatusFromOrder(oldSsd.displayOrder) : null;
      
      if (oldStatusForLog && oldStatusForLog !== newStatus) {
        await logAuditEntry(
          'reorder_ssd',
          'equipments',
          ssdId,
          {
            display_order: oldSsd?.displayOrder,
            status: oldStatusForLog
          },
          {
            display_order: baseDisplayOrder + targetIndex,
            status: newStatus
          }
        );
      }

      return updates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ssds.all });
      toast({
        title: "Ordem atualizada",
        description: "A ordem dos SSDs foi atualizada com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar ordem",
        description: "Não foi possível atualizar a ordem dos SSDs.",
        variant: "destructive"
      });
    },
  });

  const updateSSDStatus = (ssdId: string, newStatus: SSDStatus) => {
    updateStatusMutation.mutate({ ssdId, newStatus });
  };

  const updateSSDOrder = (ssdId: string, newStatus: SSDStatus, targetIndex: number) => {
    updateOrderMutation.mutate({ ssdId, newStatus, targetIndex });
  };

  return {
    ssds,
    ssdsByStatus,
    ssdAllocations,
    loading,
    updateSSDStatus,
    updateSSDOrder,
    refetch: () => queryClient.invalidateQueries({ queryKey: queryKeys.ssds.all })
  };
};
