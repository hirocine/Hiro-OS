import { useMemo, useCallback } from 'react';
import type { Equipment, EquipmentFilters } from '@/types/equipment';
import { useFilterHistory } from './useFilterHistory';

export function useAdvancedFilters(
  allEquipment: Equipment[],
  filters: EquipmentFilters,
  onFiltersChange: (filters: EquipmentFilters) => void
) {
  const { addToHistory } = useFilterHistory();

  // Sugestões baseadas nos dados existentes
  const suggestions = useMemo(() => {
    const brands = Array.from(new Set(allEquipment.map(item => item.brand))).filter(Boolean).sort();
    
    const patrimonySeries = Array.from(
      new Set(
        allEquipment
          .map(item => item.patrimonyNumber)
          .filter(Boolean)
          .map(patrimony => {
            // Extrai prefixos comuns (ex: "2024-001" -> "2024-", "EQUIP-123" -> "EQUIP-")
            const matches = patrimony!.match(/^([A-Za-z0-9]+[-_])/);
            return matches ? matches[1] : null;
          })
          .filter(Boolean)
      )
    ).sort();

    return { brands, patrimonySeries };
  }, [allEquipment]);

  // Range de valores baseado nos dados
  const valueRange = useMemo(() => {
    const values = allEquipment
      .map(item => item.value)
      .filter((value): value is number => typeof value === 'number' && value > 0);
    
    if (values.length === 0) return { min: 0, max: 50000 };
    
    const min = Math.floor(Math.min(...values) / 100) * 100; // Arredonda para baixo para centenas
    const max = Math.ceil(Math.max(...values) / 100) * 100; // Arredonda para cima para centenas
    
    return { min, max };
  }, [allEquipment]);

  // Estatísticas para filtros rápidos
  const quickFilterStats = useMemo(() => {
    const available = allEquipment.filter(item => 
      item.status === 'available' && !item.currentLoanId
    ).length;
    
    const maintenance = allEquipment.filter(item => 
      item.status === 'maintenance'
    ).length;
    
    const onLoan = allEquipment.filter(item => 
      item.currentLoanId && item.currentLoanId !== ''
    ).length;
    
    const withoutImage = allEquipment.filter(item => 
      !item.image || item.image === ''
    ).length;
    
    const highValue = allEquipment.filter(item => 
      (item.value || 0) >= 5000
    ).length;

    const byCategory = allEquipment.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      available,
      maintenance,
      onLoan,
      overdue: 0, // Seria necessário verificar datas de empréstimo
      withoutImage,
      highValue,
      byCategory
    };
  }, [allEquipment]);

  // Aplica filtros com histórico
  const applyFiltersWithHistory = useCallback((newFilters: EquipmentFilters) => {
    onFiltersChange(newFilters);
    addToHistory(newFilters);
  }, [onFiltersChange, addToHistory]);

  return {
    suggestions,
    valueRange,
    quickFilterStats,
    applyFiltersWithHistory,
  };
}