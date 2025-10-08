import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Equipment } from '@/types/equipment';
import { useToast } from '@/hooks/use-toast';
import { arrayMove } from '@dnd-kit/sortable';

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
    const categorized = ssds.reduce((acc, ssd) => {
      const status = ssd.simplifiedStatus === 'available' ? 'available' : 
                     ssd.currentLoanId ? 'loaned' : 'in_use';
      acc[status].push(ssd);
      return acc;
    }, {
      available: [] as Equipment[],
      in_use: [] as Equipment[],
      loaned: [] as Equipment[]
    });

    // Sort each category by display_order (nulls last) then by name
    const sortByOrder = (a: Equipment, b: Equipment) => {
      if (a.displayOrder === undefined && b.displayOrder === undefined) return a.name.localeCompare(b.name);
      if (a.displayOrder === undefined) return 1;
      if (b.displayOrder === undefined) return -1;
      return a.displayOrder - b.displayOrder;
    };

    categorized.available.sort(sortByOrder);
    categorized.in_use.sort(sortByOrder);
    categorized.loaned.sort(sortByOrder);

    return categorized;
  }, [ssds]);

  const updateSSDStatus = async (ssdId: string, newStatus: SSDStatus) => {
    // Store previous state for rollback
    const previousSSDs = [...ssds];
    
    try {
      // Optimistic update - update local state immediately
      setSSDs(prevSSDs => 
        prevSSDs.map(ssd => {
          if (ssd.id !== ssdId) return ssd;
          
          // Update the SSD status optimistically
          const updatedSSD = { ...ssd };
          if (newStatus === 'available') {
            updatedSSD.simplifiedStatus = 'available';
            updatedSSD.currentLoanId = undefined;
            updatedSSD.currentBorrower = undefined;
            updatedSSD.lastLoanDate = undefined;
          } else if (newStatus === 'in_use') {
            updatedSSD.simplifiedStatus = 'in_project';
            updatedSSD.currentLoanId = undefined;
            updatedSSD.currentBorrower = undefined;
            updatedSSD.lastLoanDate = undefined;
          } else if (newStatus === 'loaned') {
            updatedSSD.simplifiedStatus = 'in_project';
            updatedSSD.currentLoanId = updatedSSD.currentLoanId || ((typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
            updatedSSD.currentBorrower = updatedSSD.currentBorrower || 'Empréstimo manual';
            updatedSSD.lastLoanDate = new Date().toISOString().slice(0, 10);
          }
          return updatedSSD;
        })
      );
      
      // Prepare database updates
      const updates: any = {};
      if (newStatus === 'available') {
        updates.simplified_status = 'available';
        updates.current_loan_id = null;
        updates.current_borrower = null;
        updates.last_loan_date = null;
      } else if (newStatus === 'in_use') {
        updates.simplified_status = 'in_project';
        updates.current_loan_id = null;
        updates.current_borrower = null;
        updates.last_loan_date = null;
      } else if (newStatus === 'loaned') {
        updates.simplified_status = 'in_project';
        updates.current_loan_id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
        updates.current_borrower = 'Empréstimo manual';
        updates.last_loan_date = new Date().toISOString().slice(0, 10);
      }

      const { error } = await supabase
        .from('equipments')
        .update(updates)
        .eq('id', ssdId);

      if (error) throw error;

      // No need to manually refetch - realtime subscription will handle it
      
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

    // Determine new simplified_status and currentLoanId based on SSDStatus
    let newSimplifiedStatus: 'available' | 'in_project' = 'available';
    let newCurrentLoanId: string | null = null;
    let newCurrentBorrower: string | null = null;

    if (newStatus === 'available') {
      newSimplifiedStatus = 'available';
      newCurrentLoanId = null;
      newCurrentBorrower = null;
    } else if (newStatus === 'in_use') {
      newSimplifiedStatus = 'in_project';
      newCurrentLoanId = null;
      newCurrentBorrower = null;
    } else if (newStatus === 'loaned') {
      newSimplifiedStatus = 'in_project';
      newCurrentLoanId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
      newCurrentBorrower = 'Empréstimo manual';
    }

    // Get target column SSDs (before any changes)
    const targetColumnKey = newStatus;
    const targetColumnSsds = [...ssdsByStatus[targetColumnKey]];
    
    // Find which column the SSD is currently in
    const oldStatus: SSDStatus = ssdToUpdate.currentLoanId 
      ? 'loaned' 
      : ssdToUpdate.simplifiedStatus === 'in_project' 
        ? 'in_use' 
        : 'available';
    
    let reorderedSsds: Equipment[];
    if (oldStatus !== newStatus) {
      // Moving to different column - insert at target position
      const updatedSsd = { 
        ...ssdToUpdate, 
        simplifiedStatus: newSimplifiedStatus, 
        currentLoanId: newCurrentLoanId,
        currentBorrower: newCurrentBorrower
      };
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
      display_order: index,
      ...(ssd.id === ssdId && {
        simplified_status: newSimplifiedStatus,
        current_loan_id: newCurrentLoanId,
        current_borrower: newCurrentBorrower
      })
    }));

    // Optimistic update
    setSSDs(prev => {
      const newSsds = [...prev];
      updates.forEach(update => {
        const index = newSsds.findIndex(s => s.id === update.id);
        if (index !== -1) {
          newSsds[index] = {
            ...newSsds[index],
            displayOrder: update.display_order,
            ...(update.simplified_status && { simplifiedStatus: update.simplified_status }),
            ...(update.current_loan_id !== undefined && { currentLoanId: update.current_loan_id || undefined }),
            ...(update.current_borrower !== undefined && { currentBorrower: update.current_borrower || undefined })
          };
        }
      });
      return newSsds;
    });

    try {
      // Batch update all affected SSDs
      for (const update of updates) {
        const updateData: any = {
          display_order: update.display_order
        };
        
        if (update.simplified_status) {
          updateData.simplified_status = update.simplified_status;
        }
        if (update.current_loan_id !== undefined) {
          updateData.current_loan_id = update.current_loan_id;
        }
        if (update.current_borrower !== undefined) {
          updateData.current_borrower = update.current_borrower;
        }
        
        const { error } = await supabase
          .from('equipments')
          .update(updateData)
          .eq('id', update.id);

        if (error) throw error;
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
