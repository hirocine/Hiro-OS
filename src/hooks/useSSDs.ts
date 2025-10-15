import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Equipment } from '@/types/equipment';
import { useToast } from '@/hooks/use-toast';
import { arrayMove } from '@dnd-kit/sortable';
import { useUserRole } from './useUserRole';

export type SSDStatus = 'available' | 'in_use' | 'loaned';

export interface SSDsByStatus {
  available: Equipment[];
  in_use: Equipment[];
  loaned: Equipment[];
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

export const useSSDs = () => {
  const [ssds, setSSDs] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { logAuditEntry } = useUserRole();

  const fetchSSDs = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const { data, error } = await supabase
        .from('equipments')
      .select('*')
      .eq('category', 'storage')
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
        displayOrder: item.display_order
      }));
      
      setSSDs(transformedData as Equipment[]);
    } catch (error) {
      toast({
        title: "Erro ao carregar SSDs",
        description: "Não foi possível carregar os SSDs.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSSDs();
    
    // Debounce timer for realtime updates
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
          filter: 'category=eq.storage'
        },
        () => {
          // Debounce realtime updates to avoid multiple rapid refetches
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            fetchSSDs(true); // Silent refetch
          }, 300);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  const ssdsByStatus = useMemo<SSDsByStatus>(() => {
    // Para SSDs/HDs, o status é baseado EXCLUSIVAMENTE no Kanban (display_order)
    // NÃO consideramos currentLoanId ou simplifiedStatus, pois eles vêm de Projetos
    const result: SSDsByStatus = {
      available: [],
      in_use: [],
      loaned: [],
    };

    ssds.forEach(ssd => {
      // Determinar status baseado na posição do Kanban (display_order)
      // Valores menores = Available, médios = In Use, maiores = Loaned
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

  const updateSSDStatus = async (ssdId: string, newStatus: SSDStatus) => {
    // Store previous state for rollback
    const previousSSDs = [...ssds];
    
    try {
      // Para SSDs, o status é determinado APENAS pela posição no Kanban (display_order)
      // Não modificamos simplified_status ou current_loan_id pois eles são gerenciados por Projetos
      
      // Determinar o novo display_order baseado no status
      let newDisplayOrder: number;
      if (newStatus === 'available') {
        newDisplayOrder = 0; // Início da primeira coluna
      } else if (newStatus === 'in_use') {
        newDisplayOrder = 1000; // Início da segunda coluna
      } else { // loaned
        newDisplayOrder = 2000; // Início da terceira coluna
      }
      
      // Optimistic update - update local state immediately
      const oldSsd = ssds.find(s => s.id === ssdId);
      
      setSSDs(prevSSDs => 
        prevSSDs.map(ssd => 
          ssd.id === ssdId 
            ? { ...ssd, displayOrder: newDisplayOrder }
            : ssd
        )
      );

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
      
      toast({
        title: "Status atualizado",
        description: "Status do SSD atualizado com sucesso."
      });
    } catch (error) {
      // Rollback on error
      setSSDs(previousSSDs);
      
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do SSD.",
        variant: "destructive"
      });
    }
  };

  const updateSSDOrder = async (ssdId: string, newStatus: SSDStatus, targetIndex: number) => {
    const ssdToUpdate = ssds.find(s => s.id === ssdId);
    if (!ssdToUpdate) return;

    const previousSSDs = [...ssds];

    // Para SSDs, não modificamos simplified_status ou currentLoanId
    // Apenas atualizamos display_order baseado na posição no Kanban
    
    // Determinar base display_order para cada coluna
    const baseDisplayOrder = newStatus === 'available' ? 0 : newStatus === 'in_use' ? 1000 : 2000;

    // Get target column SSDs (before any changes)
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

    // Optimistic update
    setSSDs(prev => {
      const newSsds = [...prev];
      updates.forEach(update => {
        const index = newSsds.findIndex(s => s.id === update.id);
        if (index !== -1) {
          newSsds[index] = {
            ...newSsds[index],
            displayOrder: update.display_order
          };
        }
      });
      return newSsds;
    });

    try {
      // Batch update all affected SSDs - only display_order
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

      toast({
        title: "Ordem atualizada",
        description: "A ordem dos SSDs foi atualizada com sucesso."
      });
    } catch (error) {
      // Rollback on error
      setSSDs(previousSSDs);
      
      toast({
        title: "Erro ao atualizar ordem",
        description: "Não foi possível atualizar a ordem dos SSDs.",
        variant: "destructive"
      });
    }
  };

  return {
    ssds,
    ssdsByStatus,
    loading,
    updateSSDStatus,
    updateSSDOrder,
    refetch: fetchSSDs
  };
};
