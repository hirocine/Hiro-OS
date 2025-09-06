import { useState, useEffect, useCallback } from 'react';
import type { EquipmentFilters, SavedFilter } from '@/types/equipment';
import { logger } from '@/lib/logger';

// Implementação simplificada usando localStorage até os tipos do Supabase serem atualizados
export function useSavedFilters() {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(false);

  const STORAGE_KEY = 'equipment-saved-filters';

  // Carrega filtros salvos do localStorage
  const loadSavedFilters = useCallback(async () => {
    try {
      setLoading(true);
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedFilters = JSON.parse(stored);
        setSavedFilters(parsedFilters);
      }
    } catch (error) {
      logger.error('Failed to load saved filters from localStorage', {
        module: 'saved-filters',
        action: 'load_saved_filters',
        error: error instanceof Error ? error : String(error)
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Salva um filtro
  const saveFilter = useCallback(async (name: string, filters: EquipmentFilters) => {
    try {
      setLoading(true);
      
      const newFilter: SavedFilter = {
        id: Date.now().toString(),
        name,
        filters,
        userId: 'current-user', // Temporário
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedFilters = [newFilter, ...savedFilters];
      setSavedFilters(updatedFilters);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFilters));

      return newFilter;
    } catch (error) {
      logger.error('Failed to save filter', {
        module: 'saved-filters',
        action: 'save_filter',
        data: { name, filters },
        error: error instanceof Error ? error : String(error)
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [savedFilters]);

  // Atualiza um filtro
  const updateFilter = useCallback(async (id: string, name: string, filters: EquipmentFilters) => {
    try {
      setLoading(true);
      
      const updatedFilter: SavedFilter = {
        id,
        name,
        filters,
        userId: 'current-user', // Temporário
        createdAt: savedFilters.find(f => f.id === id)?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedFilters = savedFilters.map(filter => 
        filter.id === id ? updatedFilter : filter
      );
      
      setSavedFilters(updatedFilters);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFilters));

      return updatedFilter;
    } catch (error) {
      logger.error('Failed to update filter', {
        module: 'saved-filters',
        action: 'update_filter',
        data: { id, name, filters },
        error: error instanceof Error ? error : String(error)
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [savedFilters]);

  // Remove um filtro
  const deleteFilter = useCallback(async (id: string) => {
    try {
      setLoading(true);
      
      const updatedFilters = savedFilters.filter(filter => filter.id !== id);
      setSavedFilters(updatedFilters);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFilters));
    } catch (error) {
      logger.error('Failed to delete filter', {
        module: 'saved-filters',
        action: 'delete_filter',
        data: { id },
        error: error instanceof Error ? error : String(error)
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [savedFilters]);

  // Carrega filtros na inicialização
  useEffect(() => {
    loadSavedFilters();
  }, [loadSavedFilters]);

  return {
    savedFilters,
    loading,
    saveFilter,
    updateFilter,
    deleteFilter,
    loadSavedFilters
  };
}