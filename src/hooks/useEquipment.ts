import { useState, useMemo, useEffect } from 'react';
import { Equipment, EquipmentFilters, DashboardStats, EquipmentHierarchy } from '@/types/equipment';
import { supabase } from '@/integrations/supabase/client';
import { useLoans } from './useLoans';

export function useEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filters, setFilters] = useState<EquipmentFilters>({});
  const [loading, setLoading] = useState(true);
  const { getActiveLoanByEquipment } = useLoans();

  // Fetch equipment from Supabase
  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching equipment:', error);
        return;
      }

      // Transform database data to match Equipment interface
      const equipmentData = (data || []).map(item => ({
        ...item,
        itemType: item.item_type || 'main',
        isExpanded: false,
        parentId: item.parent_id
      })) as Equipment[];
      setEquipment(equipmentData);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const enrichedEquipment = useMemo(() => {
    return equipment.map(item => {
      const activeLoan = getActiveLoanByEquipment(item.id);
      const newStatus = activeLoan ? 'available' as const : item.status;
      return {
        ...item,
        currentLoanId: activeLoan?.id,
        currentBorrower: activeLoan?.borrowerName,
        lastLoanDate: activeLoan?.loanDate,
        // Auto-update status based on loan
        status: newStatus
      };
    });
  }, [equipment, getActiveLoanByEquipment]);

  const filteredEquipment = useMemo(() => {
    return enrichedEquipment.filter((item) => {
      if (filters.category && item.category !== filters.category) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (filters.itemType && item.itemType !== filters.itemType) return false;
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        return (
          item.name.toLowerCase().includes(searchTerm) ||
          item.brand.toLowerCase().includes(searchTerm) ||
          item.model.toLowerCase().includes(searchTerm)
        );
      }
      return true;
    });
  }, [enrichedEquipment, filters]);

  const equipmentHierarchy = useMemo(() => {
    const mainItems = filteredEquipment.filter(item => item.itemType === 'main');
    const accessories = filteredEquipment.filter(item => item.itemType === 'accessory');
    
    return mainItems.map(mainItem => {
      const itemAccessories = accessories.filter(acc => acc.parentId === mainItem.id);
      return {
        item: { ...mainItem, hasAccessories: itemAccessories.length > 0 },
        accessories: itemAccessories
      };
    });
  }, [filteredEquipment]);

  const unlinkedAccessories = useMemo(() => {
    return filteredEquipment.filter(item => item.itemType === 'accessory' && !item.parentId);
  }, [filteredEquipment]);

  const stats: DashboardStats = useMemo(() => {
    const total = enrichedEquipment.length;
    const available = enrichedEquipment.filter(item => item.status === 'available').length;
    const inUse = 0; // Removed in-use status
    const maintenance = enrichedEquipment.filter(item => item.status === 'maintenance').length;
    const mainItems = enrichedEquipment.filter(item => item.itemType === 'main').length;
    const accessories = enrichedEquipment.filter(item => item.itemType === 'accessory').length;
    
    const byCategory = enrichedEquipment.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byItemType = enrichedEquipment.reduce((acc, item) => {
      acc[item.itemType] = (acc[item.itemType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      available,
      inUse,
      maintenance,
      mainItems,
      accessories,
      byCategory: byCategory as DashboardStats['byCategory'],
      byItemType: byItemType as DashboardStats['byItemType']
    };
  }, [enrichedEquipment]);

  const addEquipment = async (newEquipment: Omit<Equipment, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('equipments')
        .insert([newEquipment])
        .select()
        .single();

      if (error) {
        console.error('Error adding equipment:', error);
        return;
      }

      if (data) {
        const equipmentData = {
          ...data,
          itemType: data.item_type || 'main',
          isExpanded: false,
          parentId: data.parent_id
        } as Equipment;
        setEquipment(prev => [...prev, equipmentData]);
      }
    } catch (error) {
      console.error('Error adding equipment:', error);
    }
  };

  const updateEquipment = async (id: string, updates: Partial<Equipment>) => {
    try {
      const { error } = await supabase
        .from('equipments')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating equipment:', error);
        return;
      }

      setEquipment(prev => 
        prev.map(item => item.id === id ? { ...item, ...updates } : item)
      );
    } catch (error) {
      console.error('Error updating equipment:', error);
    }
  };

  const deleteEquipment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('equipments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting equipment:', error);
        return;
      }

      setEquipment(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting equipment:', error);
    }
  };

  const importEquipment = async (importedEquipment: Omit<Equipment, 'id'>[]) => {
    try {
      const { data, error } = await supabase
        .from('equipments')
        .insert(importedEquipment)
        .select();

      if (error) {
        console.error('Error importing equipment:', error);
        return;
      }

      if (data) {
        const equipmentData = data.map(item => ({
          ...item,
          itemType: item.item_type || 'main',
          isExpanded: false,
          parentId: item.parent_id
        })) as Equipment[];
        setEquipment(prev => [...prev, ...equipmentData]);
      }
    } catch (error) {
      console.error('Error importing equipment:', error);
    }
  };

  const toggleEquipmentExpansion = (id: string) => {
    setEquipment(prev => 
      prev.map(item => 
        item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
      )
    );
  };

  const getMainItems = () => {
    return enrichedEquipment.filter(item => item.itemType === 'main');
  };

  return {
    equipment: filteredEquipment,
    allEquipment: equipment,
    equipmentHierarchy,
    unlinkedAccessories,
    filters,
    setFilters,
    stats,
    loading,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    importEquipment,
    toggleEquipmentExpansion,
    getMainItems
  };
}