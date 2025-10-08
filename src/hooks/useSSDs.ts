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

export const useSSDs = () => {
  const [ssds, setSSDs] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSSDs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipments')
        .select('*')
        .eq('category', 'storage')
        .eq('subcategory', 'ssd')
        .order('name');

      if (error) throw error;
      
      // Transform data to match Equipment interface
      const transformedData = (data || []).map(item => ({
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
    try {
      const updates: Partial<Equipment> = {
        simplifiedStatus: newStatus === 'available' ? 'available' : 'in_project'
      };

      const { error } = await supabase
        .from('equipments')
        .update(updates)
        .eq('id', ssdId);

      if (error) throw error;

      await fetchSSDs();
      
      toast({
        title: "Status atualizado",
        description: "Status do SSD atualizado com sucesso."
      });
    } catch (error) {
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
