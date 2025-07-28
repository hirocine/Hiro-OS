import { useState, useMemo } from 'react';
import { Equipment, EquipmentFilters, DashboardStats } from '@/types/equipment';
import { mockEquipment } from '@/data/mockData';
import { useLoans } from './useLoans';

export function useEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>(mockEquipment);
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

  const stats: DashboardStats = useMemo(() => {
    const total = enrichedEquipment.length;
    const available = enrichedEquipment.filter(item => item.status === 'available').length;
    const inUse = 0; // Removed in-use status
    const maintenance = enrichedEquipment.filter(item => item.status === 'maintenance').length;
    
    const byCategory = enrichedEquipment.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      available,
      inUse,
      maintenance,
      byCategory: byCategory as DashboardStats['byCategory']
    };
  }, [enrichedEquipment]);

  const addEquipment = (newEquipment: Omit<Equipment, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setEquipment(prev => [...prev, { ...newEquipment, id }]);
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
      id: Math.random().toString(36).substr(2, 9)
    }));
    setEquipment(prev => [...prev, ...newEquipment]);
  };

  return {
    equipment: filteredEquipment,
    allEquipment: equipment,
    filters,
    setFilters,
    stats,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    importEquipment
  };
}