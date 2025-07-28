import { useState, useMemo } from 'react';
import { Equipment, EquipmentFilters, DashboardStats, EquipmentHierarchy } from '@/types/equipment';
import { mockEquipment } from '@/data/mockData';
import { useLoans } from './useLoans';

export function useEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filters, setFilters] = useState<EquipmentFilters>({});
  const { getActiveLoanByEquipment } = useLoans();

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

  const addEquipment = (newEquipment: Omit<Equipment, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const equipmentWithDefaults = {
      ...newEquipment,
      id,
      itemType: newEquipment.itemType || 'main',
      isExpanded: false
    };
    setEquipment(prev => [...prev, equipmentWithDefaults]);
  };

  const updateEquipment = (id: string, updates: Partial<Equipment>) => {
    setEquipment(prev => 
      prev.map(item => item.id === id ? { ...item, ...updates } : item)
    );
  };

  const deleteEquipment = (id: string) => {
    setEquipment(prev => prev.filter(item => item.id !== id));
  };

  const importEquipment = (importedEquipment: Omit<Equipment, 'id'>[]) => {
    const newEquipment = importedEquipment.map(item => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      itemType: item.itemType || 'main',
      isExpanded: false
    }));
    setEquipment(prev => [...prev, ...newEquipment]);
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
    addEquipment,
    updateEquipment,
    deleteEquipment,
    importEquipment,
    toggleEquipmentExpansion,
    getMainItems
  };
}