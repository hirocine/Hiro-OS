import { useState, useEffect, useMemo } from 'react';

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

  // Reset checklist when equipment changes
  useEffect(() => {
    const initialState: ChecklistState = {};
    equipment.forEach(item => {
      initialState[item.id] = false;
    });
    setCheckedItems(initialState);
  }, [equipment]);

  // Group equipment by category with hierarchy
  const categorizedEquipment = useMemo(() => {
    const categories: { [key: string]: CategoryGroup } = {};
    
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

    return Object.values(categories);
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
  const toggleItem = (itemId: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Toggle main item and all its accessories
  const toggleMainItemWithAccessories = (itemId: string) => {
    const accessories = getAccessoriesForItem(itemId);
    const newCheckedState = !checkedItems[itemId];
    
    setCheckedItems(prev => {
      const updated = { ...prev };
      updated[itemId] = newCheckedState;
      
      // Update all accessories
      accessories.forEach(acc => {
        updated[acc.id] = newCheckedState;
      });
      
      return updated;
    });
  };

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