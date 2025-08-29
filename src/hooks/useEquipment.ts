import { useState, useMemo, useEffect } from 'react';
import { Equipment, EquipmentFilters, DashboardStats, EquipmentHierarchy, SortableField, SortOrder } from '@/types/equipment';
import { supabase } from '@/integrations/supabase/client';
import { useLoans } from './useLoans';
import { naturalSort } from '@/lib/utils';

export function useEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filters, setFilters] = useState<EquipmentFilters>({
    sortBy: 'patrimonyNumber',
    sortOrder: 'asc'
  });
  const [loading, setLoading] = useState(true);
  const { getActiveLoanByEquipment } = useLoans();

  // Fetch equipment from Supabase
  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching equipment:', error);
        return;
      }

      // Transform database data to match Equipment interface
      const equipmentData = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        category: item.category,
        subcategory: item.subcategory,
        customCategory: item.custom_category,
        status: item.status,
        itemType: item.item_type || 'main',
        parentId: item.parent_id,
        hasAccessories: false,
        isExpanded: false,
        serialNumber: item.serial_number,
        purchaseDate: item.purchase_date,
        lastMaintenance: item.last_maintenance,
        description: item.description,
        image: item.image,
        value: item.value,
        patrimonyNumber: item.patrimony_number,
        depreciatedValue: item.depreciated_value,
        receiveDate: item.receive_date,
        store: item.store,
        invoice: item.invoice,
        currentLoanId: item.current_loan_id,
        currentBorrower: item.current_borrower,
        lastLoanDate: item.last_loan_date,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      })) as Equipment[];
      setEquipment(equipmentData);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const enrichedEquipment = useMemo(() => {
    return equipment.map(item => {
      const activeLoan = getActiveLoanByEquipment(item.id);
      const newStatus = activeLoan ? 'available' as const : item.status;
      return {
        ...item,
        currentLoanId: activeLoan?.id,
        currentBorrower: activeLoan?.borrowerName,
        lastLoanDate: activeLoan?.loanDate,
        // Auto-update status based on loan
        status: newStatus
      };
    });
  }, [equipment, getActiveLoanByEquipment]);

  const sortEquipment = (items: Equipment[], sortBy: SortableField, sortOrder: SortOrder) => {
    return [...items].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sortBy) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'brand':
          valueA = a.brand.toLowerCase();
          valueB = b.brand.toLowerCase();
          break;
        case 'category':
          valueA = a.category.toLowerCase();
          valueB = b.category.toLowerCase();
          break;
        case 'status':
          valueA = a.status.toLowerCase();
          valueB = b.status.toLowerCase();
          break;
        case 'value':
          valueA = a.value || 0;
          valueB = b.value || 0;
          break;
        case 'patrimonyNumber':
          // Use natural sorting for patrimony numbers to handle numeric ordering correctly
          const patrimonySortResult = naturalSort(
            a.patrimonyNumber || '', 
            b.patrimonyNumber || ''
          );
          return sortOrder === 'asc' ? patrimonySortResult : -patrimonySortResult;
        case 'purchaseDate':
          valueA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
          valueB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (valueA < valueB) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const filteredEquipment = useMemo(() => {
    let filtered = enrichedEquipment.filter((item) => {
      if (filters.category && item.category !== filters.category) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (filters.itemType && item.itemType !== filters.itemType) return false;
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        return (
          item.name.toLowerCase().includes(searchTerm) ||
          item.brand.toLowerCase().includes(searchTerm)
        );
      }
      return true;
    });

    // Apply sorting if specified
    if (filters.sortBy && filters.sortOrder) {
      return sortEquipment(filtered, filters.sortBy, filters.sortOrder);
    }

    return filtered;
  }, [enrichedEquipment, filters]);

  const equipmentHierarchy = useMemo(() => {
    const mainItems = filteredEquipment.filter(item => item.itemType === 'main');
    const accessories = filteredEquipment.filter(item => item.itemType === 'accessory');
    
    return mainItems.map(mainItem => {
      const itemAccessories = accessories.filter(acc => acc.parentId === mainItem.id);
      return {
        item: { ...mainItem, hasAccessories: itemAccessories.length > 0 },
        accessories: itemAccessories
      };
    });
  }, [filteredEquipment]);

  const unlinkedAccessories = useMemo(() => {
    return filteredEquipment.filter(item => item.itemType === 'accessory' && !item.parentId);
  }, [filteredEquipment]);

  const stats: DashboardStats = useMemo(() => {
    const total = enrichedEquipment.length;
    const available = enrichedEquipment.filter(item => item.status === 'available').length;
    const inUse = 0; // Removed in-use status
    const maintenance = enrichedEquipment.filter(item => item.status === 'maintenance').length;
    const mainItems = enrichedEquipment.filter(item => item.itemType === 'main').length;
    const accessories = enrichedEquipment.filter(item => item.itemType === 'accessory').length;
    
    const byCategory = enrichedEquipment.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byItemType = enrichedEquipment.reduce((acc, item) => {
      acc[item.itemType] = (acc[item.itemType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate total values
    const totalValue = enrichedEquipment.reduce((acc, item) => acc + (item.value || 0), 0);
    
    const valueByCategory = enrichedEquipment.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + (item.value || 0);
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      available,
      inUse,
      maintenance,
      mainItems,
      accessories,
      byCategory: byCategory as DashboardStats['byCategory'],
      byItemType: byItemType as DashboardStats['byItemType'],
      totalValue,
      valueByCategory: valueByCategory as DashboardStats['valueByCategory']
    };
  }, [enrichedEquipment]);

  const addEquipment = async (newEquipment: Omit<Equipment, 'id'>) => {
    try {
      // Convert camelCase to snake_case for database
      const dbEquipment = {
        name: newEquipment.name,
        brand: newEquipment.brand,
        category: newEquipment.category,
        subcategory: newEquipment.subcategory || null,
        custom_category: newEquipment.customCategory || null,
        status: newEquipment.status,
        item_type: newEquipment.itemType,
        parent_id: newEquipment.parentId || null,
        serial_number: newEquipment.serialNumber || null,
        purchase_date: newEquipment.purchaseDate || null,
        last_maintenance: newEquipment.lastMaintenance || null,
        description: newEquipment.description || null,
        image: newEquipment.image || null,
        value: newEquipment.value || null,
        patrimony_number: newEquipment.patrimonyNumber || null,
        depreciated_value: newEquipment.depreciatedValue || null,
        receive_date: newEquipment.receiveDate || null,
        store: newEquipment.store || null,
        invoice: newEquipment.invoice || null
      };

      const { data, error } = await supabase
        .from('equipments')
        .insert([dbEquipment])
        .select()
        .single();

      if (error) {
        console.error('Error adding equipment:', error);
        throw error;
      }

      if (data) {
        const equipmentData = {
          id: data.id,
          name: data.name,
          brand: data.brand,
          category: data.category,
          subcategory: data.subcategory,
          customCategory: data.custom_category,
          status: data.status,
          itemType: data.item_type || 'main',
          parentId: data.parent_id,
          isExpanded: false,
          serialNumber: data.serial_number,
          purchaseDate: data.purchase_date,
          lastMaintenance: data.last_maintenance,
          description: data.description,
          image: data.image,
          value: data.value,
          patrimonyNumber: data.patrimony_number,
          depreciatedValue: data.depreciated_value,
          receiveDate: data.receive_date,
          store: data.store,
          invoice: data.invoice,
          currentLoanId: data.current_loan_id,
          currentBorrower: data.current_borrower,
          lastLoanDate: data.last_loan_date
        } as Equipment;
        setEquipment(prev => [...prev, equipmentData]);
        return { success: true };
      }
    } catch (error) {
      console.error('Error adding equipment:', error);
      throw error;
    }
  };

  const updateEquipment = async (id: string, updates: Partial<Equipment>) => {
    try {
      // Convert camelCase to snake_case for database
      const dbUpdates = {
        name: updates.name,
        brand: updates.brand,
        category: updates.category,
        subcategory: updates.subcategory,
        custom_category: updates.customCategory,
        status: updates.status,
        item_type: updates.itemType,
        parent_id: updates.parentId || null,
        serial_number: updates.serialNumber,
        purchase_date: updates.purchaseDate,
        last_maintenance: updates.lastMaintenance,
        description: updates.description,
        image: updates.image,
        value: updates.value,
        patrimony_number: updates.patrimonyNumber,
        depreciated_value: updates.depreciatedValue,
        receive_date: updates.receiveDate,
        store: updates.store,
        invoice: updates.invoice,
        current_loan_id: updates.currentLoanId,
        current_borrower: updates.currentBorrower,
        last_loan_date: updates.lastLoanDate
      };

      // Remove undefined values
      const cleanedUpdates = Object.fromEntries(
        Object.entries(dbUpdates).filter(([_, value]) => value !== undefined)
      );

      const { error } = await supabase
        .from('equipments')
        .update(cleanedUpdates)
        .eq('id', id);

      if (error) {
        console.error('Error updating equipment:', error);
        throw error;
      }

      setEquipment(prev => 
        prev.map(item => item.id === id ? { ...item, ...updates } : item)
      );

      return { success: true };
    } catch (error) {
      console.error('Error updating equipment:', error);
      throw error;
    }
  };

  const deleteEquipment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('equipments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting equipment:', error);
        return;
      }

      setEquipment(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting equipment:', error);
    }
  };

  const importEquipment = async (importedEquipment: Omit<Equipment, 'id'>[]) => {
    try {
      console.log('🔄 Starting import process with', importedEquipment.length, 'items');
      
      // Separate main items and accessories for proper processing
      const mainItems = importedEquipment.filter(item => item.itemType === 'main');
      const accessories = importedEquipment.filter(item => item.itemType === 'accessory');
      
      console.log('📦 Processing', mainItems.length, 'main items and', accessories.length, 'accessories');
      
      // Step 1: Insert main items first
      const insertedMainItems: Equipment[] = [];
      if (mainItems.length > 0) {
        const dbMainItems = mainItems.map(item => ({
          name: item.name,
          brand: item.brand,
          category: item.category,
          status: item.status,
          item_type: item.itemType,
          parent_id: null, // Main items have no parent
          serial_number: item.serialNumber || null,
          purchase_date: item.purchaseDate || null,
          last_maintenance: item.lastMaintenance || null,
          description: item.description || null,
          image: item.image || null,
          value: item.value || null,
          patrimony_number: item.patrimonyNumber || null,
          depreciated_value: item.depreciatedValue || null,
          receive_date: item.receiveDate || null,
          store: item.store || null,
          invoice: item.invoice || null
        }));

        const { data: mainData, error: mainError } = await supabase
          .from('equipments')
          .insert(dbMainItems)
          .select();

        if (mainError) {
          console.error('❌ Error inserting main items:', mainError);
          throw new Error(`Erro ao inserir itens principais: ${mainError.message}`);
        }

        if (mainData) {
          const transformedMainItems = mainData.map(item => ({
            id: item.id,
            name: item.name,
            brand: item.brand,
            category: item.category,
            status: item.status,
            itemType: item.item_type || 'main',
            parentId: item.parent_id,
            isExpanded: false,
            serialNumber: item.serial_number,
            purchaseDate: item.purchase_date,
            lastMaintenance: item.last_maintenance,
            description: item.description,
            image: item.image,
            value: item.value,
            patrimonyNumber: item.patrimony_number,
            depreciatedValue: item.depreciated_value,
            receiveDate: item.receive_date,
            store: item.store,
            invoice: item.invoice
          })) as Equipment[];
          
          insertedMainItems.push(...transformedMainItems);
          console.log('✅ Successfully inserted', transformedMainItems.length, 'main items');
        }
      }

      // Step 2: Process accessories with correct parent IDs
      const insertedAccessories: Equipment[] = [];
      if (accessories.length > 0) {
        // Create a mapping from temporary parent IDs to real database IDs
        const parentIdMapping = new Map<string, string>();
        
        // Map original main items to their new database IDs
        mainItems.forEach((originalMainItem, index) => {
          if (insertedMainItems[index]) {
            // Use patrimony number or name as temporary key for mapping
            const tempKey = originalMainItem.patrimonyNumber || originalMainItem.name;
            parentIdMapping.set(tempKey, insertedMainItems[index].id);
          }
        });

        // Also map existing main items for accessories that reference them
        const existingMainItems = equipment.filter(item => item.itemType === 'main');
        existingMainItems.forEach(item => {
          const tempKey = item.patrimonyNumber || item.name;
          parentIdMapping.set(tempKey, item.id);
        });

        console.log('🔗 Created parent ID mapping with', parentIdMapping.size, 'entries');

        const dbAccessories = accessories.map(item => {
          let parentId: string | null = null;
          
          // Try to find parent ID using the mapping
          if (item.parentId) {
            parentId = parentIdMapping.get(item.parentId) || null;
            if (!parentId) {
              console.warn('⚠️ Could not find parent for accessory:', item.name, 'with parentId:', item.parentId);
            }
          }

          return {
            name: item.name,
            brand: item.brand,
            category: item.category,
            status: item.status,
            item_type: item.itemType,
            parent_id: parentId,
            serial_number: item.serialNumber || null,
            purchase_date: item.purchaseDate || null,
            last_maintenance: item.lastMaintenance || null,
            description: item.description || null,
            image: item.image || null,
            value: item.value || null,
            patrimony_number: item.patrimonyNumber || null,
            depreciated_value: item.depreciatedValue || null,
            receive_date: item.receiveDate || null,
            store: item.store || null,
            invoice: item.invoice || null
          };
        });

        const { data: accessoryData, error: accessoryError } = await supabase
          .from('equipments')
          .insert(dbAccessories)
          .select();

        if (accessoryError) {
          console.error('❌ Error inserting accessories:', accessoryError);
          throw new Error(`Erro ao inserir acessórios: ${accessoryError.message}`);
        }

        if (accessoryData) {
          const transformedAccessories = accessoryData.map(item => ({
            id: item.id,
            name: item.name,
            brand: item.brand,
            category: item.category,
            status: item.status,
            itemType: item.item_type || 'accessory',
            parentId: item.parent_id,
            isExpanded: false,
            serialNumber: item.serial_number,
            purchaseDate: item.purchase_date,
            lastMaintenance: item.last_maintenance,
            description: item.description,
            image: item.image,
            value: item.value,
            patrimonyNumber: item.patrimony_number,
            depreciatedValue: item.depreciated_value,
            receiveDate: item.receive_date,
            store: item.store,
            invoice: item.invoice
          })) as Equipment[];
          
          insertedAccessories.push(...transformedAccessories);
          console.log('✅ Successfully inserted', transformedAccessories.length, 'accessories');
        }
      }

      // Update state with all new equipment
      const allNewEquipment = [...insertedMainItems, ...insertedAccessories];
      setEquipment(prev => [...prev, ...allNewEquipment]);
      
      console.log('🎉 Import completed successfully! Total items imported:', allNewEquipment.length);
      
    } catch (error) {
      console.error('💥 Import failed:', error);
      throw error;
    }
  };

  const toggleEquipmentExpansion = (id: string) => {
    setEquipment(prev => 
      prev.map(item => 
        item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
      )
    );
  };

  const getMainItems = () => {
    return enrichedEquipment.filter(item => item.itemType === 'main');
  };

  const handleSort = (field: SortableField, order: SortOrder) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: order
    }));
  };

  const clearSort = () => {
    setFilters(prev => ({
      ...prev,
      sortBy: undefined,
      sortOrder: undefined
    }));
  };

  return {
    equipment: filteredEquipment,
    allEquipment: equipment,
    equipmentHierarchy,
    unlinkedAccessories,
    filters,
    setFilters,
    stats,
    loading,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    importEquipment,
    toggleEquipmentExpansion,
    getMainItems,
    handleSort,
    clearSort
  };
}