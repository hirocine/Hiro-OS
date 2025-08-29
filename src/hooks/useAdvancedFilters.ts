import { useMemo, useCallback } from 'react';
import type { Equipment, EquipmentFilters } from '@/types/equipment';
import { useFilterHistory } from './useFilterHistory';

export function useAdvancedFilters(
  allEquipment: Equipment[],
  filters: EquipmentFilters,
  onFiltersChange: (filters: EquipmentFilters) => void
) {
  const { addToHistory } = useFilterHistory();

  // Sugestões baseadas nos dados existentes - memoizado para performance
  const suggestions = useMemo(() => {
    if (!allEquipment?.length) return { brands: [], patrimonySeries: [] };
    
    const brands = Array.from(new Set(
      allEquipment
        .map(item => item.brand)
        .filter(Boolean)
        .filter(brand => typeof brand === 'string' && brand.trim() !== '')
    )).sort();
    
    const patrimonySeries = Array.from(
      new Set(
        allEquipment
          .map(item => item.patrimonyNumber)
          .filter(Boolean)
          .map(patrimony => {
            if (typeof patrimony !== 'string') return null;
            // Extrai prefixos comuns (ex: "2024-001" -> "2024-", "EQUIP-123" -> "EQUIP-")
            const matches = patrimony.match(/^([A-Za-z0-9]+[-_])/);
            return matches ? matches[1] : null;
          })
          .filter(Boolean)
      )
    ).sort();

    return { brands, patrimonySeries };
  }, [allEquipment]);

  // Range de valores baseado nos dados - memoizado
  const valueRange = useMemo(() => {
    if (!allEquipment?.length) return { min: 0, max: 50000 };
    
    const values = allEquipment
      .map(item => item.value)
      .filter((value): value is number => typeof value === 'number' && value > 0);
    
    if (values.length === 0) return { min: 0, max: 50000 };
    
    const min = Math.floor(Math.min(...values) / 100) * 100; // Arredonda para baixo para centenas
    const max = Math.ceil(Math.max(...values) / 100) * 100; // Arredonda para cima para centenas
    
    return { min, max };
  }, [allEquipment]);

  // Estatísticas otimizadas para filtros rápidos
  const quickFilterStats = useMemo(() => {
    if (!allEquipment?.length) {
      return {
        available: 0,
        maintenance: 0,
        onLoan: 0,
        overdue: 0,
        withoutImage: 0,
        highValue: 0,
        byCategory: {}
      };
    }

    const stats = allEquipment.reduce((acc, item) => {
      // Status
      if (item.status === 'available' && !item.currentLoanId) {
        acc.available++;
      }
      if (item.status === 'maintenance') {
        acc.maintenance++;
      }
      if (item.currentLoanId && item.currentLoanId !== '') {
        acc.onLoan++;
      }
      
      // Imagem
      if (!item.image || item.image === '') {
        acc.withoutImage++;
      }
      
      // Alto valor
      if ((item.value || 0) >= 5000) {
        acc.highValue++;
      }

      // Por categoria
      if (item.category) {
        acc.byCategory[item.category] = (acc.byCategory[item.category] || 0) + 1;
      }

      return acc;
    }, {
      available: 0,
      maintenance: 0,
      onLoan: 0,
      overdue: 0, // Seria necessário verificar datas de empréstimo
      withoutImage: 0,
      highValue: 0,
      byCategory: {} as Record<string, number>
    });

    return stats;
  }, [allEquipment]);

  // Aplica filtros com histórico - função memoizada
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