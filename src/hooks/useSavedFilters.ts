import { useState, useEffect, useCallback } from 'react';
import type { EquipmentFilters, SavedFilter } from '@/types/equipment';

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
      console.error('Erro ao carregar filtros salvos:', error);
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
      console.error('Erro ao salvar filtro:', error);
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
      console.error('Erro ao atualizar filtro:', error);
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
      console.error('Erro ao remover filtro:', error);
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