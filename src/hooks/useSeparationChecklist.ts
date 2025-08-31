import { useState, useEffect, useMemo, useCallback } from 'react';

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

  console.log('🧾 useSeparationChecklist received equipment:', {
    totalCount: equipment.length,
    mainItems: equipment.filter(eq => eq.itemType === 'main').length,
    accessories: equipment.filter(eq => eq.itemType === 'accessory').length,
    items: equipment.map(eq => ({
      id: eq.id,
      name: eq.name,
      itemType: eq.itemType,
      parentId: eq.parentId,
      category: eq.category
    }))
  });

  // Reset checklist when equipment changes
  useEffect(() => {
    const equipmentIds = equipment.map(item => item.id).sort().join(',');
    console.log('🔄 Equipment effect triggered, current equipment IDs:', equipmentIds);
    
    const initialState: ChecklistState = {};
    equipment.forEach(item => {
      initialState[item.id] = false;
    });
    console.log('📋 Initial checklist state:', initialState);
    setCheckedItems(initialState);
  }, [equipment.length, equipment.map(item => item.id).join(',')]);

  // Group equipment by category with hierarchy
  const categorizedEquipment = useMemo(() => {
    console.log('🏗️ Building categorized equipment from:', equipment.length, 'items');
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
        console.log('➕ Added main item to category', item.category, ':', item.name);
      }
    });

    // Second pass: add accessories under their parent items
    equipment.forEach(item => {
      if (item.itemType === 'accessory' && item.parentId) {
        // Find the parent item's category
        const parent = equipment.find(eq => eq.id === item.parentId);
        if (parent && categories[parent.category]) {
          categories[parent.category].items.push(item);
          console.log('🔧 Added accessory to category', parent.category, ':', item.name, '(parent:', parent.name, ')');
        } else {
          console.warn('⚠️ Orphaned accessory found:', item.name, 'parentId:', item.parentId);
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
    console.log('📦 Categorized equipment result:', {
      totalCategories: result.length,
      categories: result.map(cat => ({
        category: cat.category,
        itemCount: cat.items.length,
        mainItems: cat.items.filter(item => item.itemType === 'main').length,
        accessories: cat.items.filter(item => item.itemType === 'accessory').length
      }))
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
    console.log('🔄 Toggling item:', itemId);
    setCheckedItems(prev => {
      const currentState = prev[itemId];
      const newState = !currentState;
      console.log('✅ Toggling', itemId, 'from', currentState, 'to', newState);
      return {
        ...prev,
        [itemId]: newState
      };
    });
  }, []);

  // Toggle main item and all its accessories
  const toggleMainItemWithAccessories = useCallback((itemId: string) => {
    console.log('🔄 Toggling main item with accessories:', itemId);
    setCheckedItems(prev => {
      const accessories = equipment.filter(item => 
        item.itemType === 'accessory' && item.parentId === itemId
      );
      const currentState = prev[itemId];
      const newState = !currentState;
      
      console.log('🔧 Main item', itemId, 'changing from', currentState, 'to', newState);
      console.log('🔧 Accessories to update:', accessories.length);
      
      const updated = { ...prev };
      updated[itemId] = newState;
      
      // Update all accessories
      accessories.forEach(acc => {
        updated[acc.id] = newState;
        console.log('🔧 Setting accessory', acc.id, 'to:', newState);
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