import { useState, useMemo } from 'react';
import { Equipment, EquipmentFilters, DashboardStats } from '@/types/equipment';
import { mockEquipment } from '@/data/mockData';

export function useEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>(mockEquipment);
  const [filters, setFilters] = useState<EquipmentFilters>({});

  const filteredEquipment = useMemo(() => {
    return equipment.filter((item) => {
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
  }, [equipment, filters]);

  const stats: DashboardStats = useMemo(() => {
    const total = equipment.length;
    const available = equipment.filter(item => item.status === 'available').length;
    const inUse = equipment.filter(item => item.status === 'in-use').length;
    const maintenance = equipment.filter(item => item.status === 'maintenance').length;
    
    const byCategory = equipment.reduce((acc, item) => {
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
  }, [equipment]);

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

  return {
    equipment: filteredEquipment,
    allEquipment: equipment,
    filters,
    setFilters,
    stats,
    addEquipment,
    updateEquipment,
    deleteEquipment
  };
}