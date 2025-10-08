import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Equipment } from '@/types/equipment';
import { useToast } from '@/hooks/use-toast';

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
        parentId: item.parent_id
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
    return ssds.reduce((acc, ssd) => {
      const status = ssd.simplifiedStatus === 'available' ? 'available' : 
                     ssd.currentLoanId ? 'loaned' : 'in_use';
      acc[status].push(ssd);
      return acc;
    }, {
      available: [] as Equipment[],
      in_use: [] as Equipment[],
      loaned: [] as Equipment[]
    });
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
          } else if (newStatus === 'in_use') {
            updatedSSD.simplifiedStatus = 'in_project';
            updatedSSD.currentLoanId = undefined;
            updatedSSD.currentBorrower = undefined;
          } else if (newStatus === 'loaned') {
            updatedSSD.simplifiedStatus = 'in_project';
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
      } else if (newStatus === 'in_use') {
        updates.simplified_status = 'in_project';
        updates.current_loan_id = null;
        updates.current_borrower = null;
      } else if (newStatus === 'loaned') {
        updates.simplified_status = 'in_project';
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

  return {
    ssds,
    ssdsByStatus,
    loading,
    updateSSDStatus,
    refetch: fetchSSDs
  };
};
