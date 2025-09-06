import { useState, useCallback, useMemo } from 'react';
import { Equipment } from '@/types/equipment';

export interface BulkSelectionState {
  selectedItems: Set<string>;
  isAllSelected: boolean;
  isPartialSelected: boolean;
}

export function useBulkSelection(items: Equipment[]) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const selectionState = useMemo((): BulkSelectionState => {
    const totalItems = items.length;
    const selectedCount = selectedItems.size;
    
    return {
      selectedItems,
      isAllSelected: totalItems > 0 && selectedCount === totalItems,
      isPartialSelected: selectedCount > 0 && selectedCount < totalItems
    };
  }, [selectedItems, items.length]);

  const toggleItem = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selectionState.isAllSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  }, [items, selectionState.isAllSelected]);

  const selectItems = useCallback((itemIds: string[]) => {
    setSelectedItems(new Set(itemIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const getSelectedItems = useCallback(() => {
    return items.filter(item => selectedItems.has(item.id));
  }, [items, selectedItems]);

  return {
    ...selectionState,
    toggleItem,
    toggleAll,
    selectItems,
    clearSelection,
    getSelectedItems,
    selectedCount: selectedItems.size
  };
}