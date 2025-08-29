import { useState, useEffect, useCallback } from 'react';
import type { EquipmentFilters } from '@/types/equipment';

interface FilterHistoryItem {
  id: string;
  filters: EquipmentFilters;
  timestamp: number;
  name?: string;
}

const HISTORY_KEY = 'equipment-filter-history';
const MAX_HISTORY_ITEMS = 10;

export function useFilterHistory() {
  const [history, setHistory] = useState<FilterHistoryItem[]>([]);

  // Carrega histórico do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        const parsedHistory = JSON.parse(stored);
        setHistory(parsedHistory);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de filtros:', error);
    }
  }, []);

  // Salva histórico no localStorage
  const saveToStorage = useCallback((historyItems: FilterHistoryItem[]) => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(historyItems));
    } catch (error) {
      console.error('Erro ao salvar histórico de filtros:', error);
    }
  }, []);

  // Adiciona filtro ao histórico
  const addToHistory = useCallback((filters: EquipmentFilters, name?: string) => {
    // Não adiciona filtros vazios
    const hasFilters = Object.keys(filters).some(key => {
      const value = filters[key as keyof EquipmentFilters];
      return value !== undefined && value !== null && value !== '';
    });

    if (!hasFilters) return;

    const newItem: FilterHistoryItem = {
      id: Date.now().toString(),
      filters,
      timestamp: Date.now(),
      name
    };

    setHistory(prevHistory => {
      // Remove itens duplicados (baseado nos filtros)
      const filteredHistory = prevHistory.filter(item => 
        JSON.stringify(item.filters) !== JSON.stringify(filters)
      );

      // Adiciona novo item no início
      const newHistory = [newItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
      
      saveToStorage(newHistory);
      return newHistory;
    });
  }, [saveToStorage]);

  // Remove item do histórico
  const removeFromHistory = useCallback((id: string) => {
    setHistory(prevHistory => {
      const newHistory = prevHistory.filter(item => item.id !== id);
      saveToStorage(newHistory);
      return newHistory;
    });
  }, [saveToStorage]);

  // Limpa todo o histórico
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  // Formata nome do filtro baseado nos filtros aplicados
  const getFilterDisplayName = useCallback((filters: EquipmentFilters) => {
    const parts: string[] = [];

    if (filters.search) parts.push(`"${filters.search}"`);
    if (filters.category) parts.push(filters.category);
    if (filters.status) parts.push(filters.status);
    if (filters.brand) parts.push(filters.brand);
    if (filters.minValue || filters.maxValue) {
      const min = filters.minValue ? `R$ ${filters.minValue}` : '0';
      const max = filters.maxValue ? `R$ ${filters.maxValue}` : '∞';
      parts.push(`${min} - ${max}`);
    }

    return parts.join(' • ') || 'Filtros personalizados';
  }, []);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getFilterDisplayName
  };
}