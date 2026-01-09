import { useState, useEffect, useMemo, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  itemType: 'main' | 'accessory';
  parentId?: string;
  patrimonyNumber?: string;
  brand?: string;
}

interface CategoryGroup {
  category: string;
  items: EquipmentItem[];
}

interface ChecklistState {
  [itemId: string]: boolean;
}

export function useSeparationChecklist(equipment: EquipmentItem[]) {
  const [checkedItems, setCheckedItems] = useState<ChecklistState>({});

  logger.debug('Separation checklist initialized', {
    module: 'separation-checklist',
    data: {
      totalCount: equipment.length,
      mainItems: equipment.filter(eq => eq.itemType === 'main').length,
      accessories: equipment.filter(eq => eq.itemType === 'accessory').length
    },
    action: 'initialize_checklist'
  });

  // Memoize equipment IDs to prevent unnecessary resets
  const equipmentIds = useMemo(
    () => equipment.map(item => item.id).join(','),
    [equipment]
  );

  // Reset checklist when equipment changes
  useEffect(() => {
    logger.debug('Equipment changed, resetting checklist', {
      module: 'separation-checklist',
      data: { equipmentCount: equipment.length },
      action: 'reset_checklist'
    });
    
    const initialState: ChecklistState = {};
    equipment.forEach(item => {
      initialState[item.id] = false;
    });
    setCheckedItems(initialState);
  }, [equipmentIds]);

  // Group equipment by category with hierarchy
  const categorizedEquipment = useMemo(() => {
    logger.debug('Building categorized equipment', {
      module: 'separation-checklist',
      data: { totalItems: equipment.length },
      action: 'categorize_equipment'
    });
    
    const categories: { [key: string]: CategoryGroup } = {};
    let orphanedAccessories = 0;
    
    // First pass: add all main items
    equipment.forEach(item => {
      if (item.itemType === 'main') {
        if (!categories[item.category]) {
          categories[item.category] = {
            category: item.category,
            items: []
          };
        }
        categories[item.category].items.push(item);
      }
    });

    // Second pass: add accessories under their parent items
    equipment.forEach(item => {
      if (item.itemType === 'accessory' && item.parentId) {
        // Find the parent item's category
        const parent = equipment.find(eq => eq.id === item.parentId);
        if (parent && categories[parent.category]) {
          categories[parent.category].items.push(item);
        } else {
          orphanedAccessories++;
          logger.warn('Orphaned accessory found', {
            module: 'separation-checklist',
            data: {
              accessoryName: item.name,
              parentId: item.parentId
            }
          });
        }
      }
    });

    // Sort items within each category (main items first, then accessories)
    Object.values(categories).forEach(category => {
      category.items.sort((a, b) => {
        if (a.itemType === 'main' && b.itemType === 'accessory') return -1;
        if (a.itemType === 'accessory' && b.itemType === 'main') return 1;
        return a.name.localeCompare(b.name);
      });
    });

    const result = Object.values(categories);
    logger.info('Equipment categorized successfully', {
      module: 'separation-checklist',
      data: {
        totalCategories: result.length,
        orphanedAccessories,
        categoryDetails: result.map(cat => ({
          category: cat.category,
          itemCount: cat.items.length,
          mainItems: cat.items.filter(item => item.itemType === 'main').length,
          accessories: cat.items.filter(item => item.itemType === 'accessory').length
        }))
      }
    });

    return result;
  }, [equipment]);

  // Check if all items are checked
  const allItemsChecked = useMemo(() => {
    return equipment.length > 0 && equipment.every(item => checkedItems[item.id]);
  }, [equipment, checkedItems]);

  // Get accessories for a main item
  const getAccessoriesForItem = (itemId: string) => {
    return equipment.filter(item => 
      item.itemType === 'accessory' && item.parentId === itemId
    );
  };

  // Check if all accessories for a main item are checked
  const allAccessoriesChecked = (mainItemId: string) => {
    const accessories = getAccessoriesForItem(mainItemId);
    return accessories.length === 0 || accessories.every(acc => checkedItems[acc.id]);
  };

  // Toggle item check
  const toggleItem = useCallback((itemId: string) => {
    setCheckedItems(prev => {
      const currentState = prev[itemId];
      const newState = !currentState;
      
      logger.debug('Toggling item in checklist', {
        module: 'separation-checklist',
        data: {
          itemId,
          fromState: currentState,
          toState: newState
        },
        action: 'toggle_item'
      });
      
      return {
        ...prev,
        [itemId]: newState
      };
    });
  }, []);

  // Toggle main item and all its accessories
  const toggleMainItemWithAccessories = useCallback((itemId: string) => {
    setCheckedItems(prev => {
      const accessories = equipment.filter(item => 
        item.itemType === 'accessory' && item.parentId === itemId
      );
      const currentState = prev[itemId];
      const newState = !currentState;
      
      logger.debug('Toggling main item with accessories', {
        module: 'separation-checklist',
        data: {
          mainItemId: itemId,
          fromState: currentState,
          toState: newState,
          accessoryCount: accessories.length
        },
        action: 'toggle_main_with_accessories'
      });
      
      const updated = { ...prev };
      updated[itemId] = newState;
      
      // Update all accessories
      accessories.forEach(acc => {
        updated[acc.id] = newState;
      });
      
      return updated;
    });
  }, [equipment]);

  // Get checked count for statistics
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = equipment.length;

  return {
    categorizedEquipment,
    checkedItems,
    allItemsChecked,
    checkedCount,
    totalCount,
    toggleItem,
    toggleMainItemWithAccessories,
    allAccessoriesChecked,
    getAccessoriesForItem
  };
}