import { useState, useMemo, useEffect, useCallback } from 'react';
import { Equipment, EquipmentFilters, DashboardStats, EquipmentHierarchy, SortableField, SortOrder, EquipmentCategory } from '@/types/equipment';
import { supabase } from '@/integrations/supabase/client';
import { naturalSort } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { createDatabaseError, createValidationError, wrapAsync } from '@/lib/errors';
import type { Result } from '@/types/common';

export interface UseEquipmentReturn {
  equipment: Equipment[];
  enrichedEquipment: Equipment[];
  filteredEquipment: Equipment[];
  equipmentHierarchy: EquipmentHierarchy[];
  unlinkedAccessories: Equipment[];
  stats: DashboardStats;
  filters: EquipmentFilters;
  loading: boolean;
  error: string | null;
  allEquipment: Equipment[];
  setFilters: (filters: EquipmentFilters) => void;
  addEquipment: (equipment: Omit<Equipment, 'id'>) => Promise<Result<Equipment>>;
  updateEquipment: (id: string, updates: Partial<Equipment>) => Promise<Result<void>>;
  deleteEquipment: (id: string) => Promise<Result<void>>;
  convertToAccessory: (equipmentId: string, parentId: string) => Promise<Result<void>>;
  importEquipment: (equipment: Omit<Equipment, 'id'>[]) => Promise<Result<Equipment[]>>;
  toggleEquipmentExpansion: (id: string) => void;
  getMainItems: () => Equipment[];
  handleSort: (field: SortableField, order: SortOrder) => void;
  clearSort: () => void;
  fetchEquipment: () => Promise<void>;
}

export function useEquipment(): UseEquipmentReturn {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filters, setFilters] = useState<EquipmentFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch equipment from Supabase
  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = useCallback(async (): Promise<void> => {
    const result = await wrapAsync(async () => {
      setLoading(true);
      setError(null);
      
      logger.apiCall('fetchEquipment', 'GET', '/equipments');

      const { data, error } = await supabase
        .from('equipments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw createDatabaseError('Erro ao buscar equipamentos', error.message);
      }

      // Transform database data with proper type safety and fallbacks
      const equipmentData: Equipment[] = (data || []).map((item): Equipment => ({
        id: String(item.id || ''),
        name: String(item.name || 'Nome não informado'),
        brand: String(item.brand || 'Marca não informada'),
        category: (item.category || 'accessories') as Equipment['category'],
        subcategory: item.subcategory || undefined,
        customCategory: item.custom_category || undefined,
        status: item.status === 'maintenance' ? 'maintenance' : 'available',
        simplifiedStatus: (item.simplified_status || 'available') as 'available' | 'in_project',
        itemType: (item.item_type || 'main') as Equipment['itemType'],
        parentId: item.parent_id || undefined,
        hasAccessories: false,
        isExpanded: false,
        serialNumber: item.serial_number || undefined,
        purchaseDate: item.purchase_date || undefined,
        lastMaintenance: item.last_maintenance || undefined,
        description: item.description || undefined,
        image: item.image || undefined,
        value: item.value ? Number(item.value) : undefined,
        patrimonyNumber: item.patrimony_number || undefined,
        depreciatedValue: item.depreciated_value ? Number(item.depreciated_value) : undefined,
        receiveDate: item.receive_date || undefined,
        store: item.store || undefined,
        invoice: item.invoice || undefined,
        currentLoanId: item.current_loan_id || undefined,
        currentBorrower: item.current_borrower || undefined,
        lastLoanDate: item.last_loan_date || undefined,
        capacity: item.capacity ? Number(item.capacity) : undefined,
      }));
      
      logger.apiResponse('fetchEquipment', '/equipments', true, { count: equipmentData.length });
      return equipmentData;
    });

    if (result.error) {
      logger.error('Falha ao buscar equipamentos', { error: result.error.message });
      setError(result.error.message);
    } else {
      setEquipment(result.data || []);
    }
    
    setLoading(false);
  }, []);

  const enrichedEquipment = useMemo(() => {
    const result = equipment.map(item => {
      const hasAccessories = equipment.some(eq => eq.parentId === item.id);
      
      return {
        ...item,
        // Initialize isExpanded for main items with accessories
        isExpanded: item.isExpanded ?? (hasAccessories && item.itemType === 'main'),
        hasAccessories,
        // Keep existing loan info for display purposes only
        currentLoanId: item.currentLoanId,
        currentBorrower: item.currentBorrower,
        lastLoanDate: item.lastLoanDate,
      };
    });
    
    return result;
  }, [equipment]);

  const sortEquipment = <T extends Equipment>(items: T[], sortBy: SortableField, sortOrder: SortOrder): T[] => {
    return [...items].sort((a, b) => {
      let valueA: unknown;
      let valueB: unknown;

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
      // Apply category filter
      if (filters.category && item.category !== filters.category) {
        return false;
      }
      
      // Apply status filter
      if (filters.status && item.status !== filters.status) {
        return false;
      }
      
      // Apply item type filter
      if (filters.itemType && item.itemType !== filters.itemType) {
        return false;
      }
      
      // Apply brand filter
      if (filters.brand && item.brand.toLowerCase() !== filters.brand.toLowerCase()) {
        return false;
      }
      
      // Apply search filter (in addition to other filters, not exclusively)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = (
          item.name.toLowerCase().includes(searchTerm) ||
          item.brand.toLowerCase().includes(searchTerm) ||
          item.serialNumber?.toLowerCase().includes(searchTerm) ||
          item.description?.toLowerCase().includes(searchTerm)
        );
        if (!matchesSearch) {
          return false;
        }
      }
      
      return true;
    });

    // Apply sorting if specified - ensure correct typing
    if (filters.sortBy && filters.sortOrder) {
      filtered = sortEquipment(filtered, filters.sortBy, filters.sortOrder);
    }

    return filtered;
  }, [enrichedEquipment, filters]);

  const equipmentHierarchy = useMemo(() => {
    const mainItems = filteredEquipment.filter(item => item.itemType === 'main');
    const accessories = filteredEquipment.filter(item => item.itemType === 'accessory');
    
    const hierarchy = mainItems.map(mainItem => {
      const itemAccessories = accessories.filter(acc => acc.parentId === mainItem.id);
      const hasAccessories = itemAccessories.length > 0;
      
      // Preservar isExpanded ou expandir por padrão se tem acessórios
      const isExpanded = mainItem.isExpanded ?? (hasAccessories ? true : false);
      
      return {
        item: { 
          ...mainItem, 
          hasAccessories,
          isExpanded
        },
        accessories: itemAccessories
      };
    });
    
    return hierarchy;
  }, [filteredEquipment]);

  const unlinkedAccessories = useMemo(() => {
    return filteredEquipment.filter(item => item.itemType === 'accessory' && !item.parentId);
  }, [filteredEquipment]);

  const stats: DashboardStats = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    const categoryInUse: Record<string, number> = {};
    let mainItems = 0;
    let accessories = 0;

    enrichedEquipment.forEach(eq => {
      const category = eq.category.toLowerCase();
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;

      // Count in use by category
      if (eq.simplifiedStatus === 'in_project') {
        categoryInUse[category] = (categoryInUse[category] || 0) + 1;
      }

      if (eq.itemType === 'main') mainItems++;
      else accessories++;
    });

    const inProject = enrichedEquipment.filter(
      eq => eq.simplifiedStatus === 'in_project'
    ).length;
    
    const available = enrichedEquipment.filter(
      eq => eq.simplifiedStatus === 'available' && eq.status !== 'maintenance'
    ).length;

    const inUse = enrichedEquipment.filter(
      eq => eq.currentLoanId !== null && eq.simplifiedStatus === 'in_project'
    ).length;

    const maintenance = enrichedEquipment.filter(
      eq => eq.status === 'maintenance'
    ).length;

    return {
      total: enrichedEquipment.length,
      byCategory: {
        camera: categoryCounts['camera'] || 0,
        audio: categoryCounts['audio'] || 0,
        lighting: categoryCounts['lighting'] || 0,
        accessories: categoryCounts['accessories'] || 0,
        storage: categoryCounts['storage'] || 0,
      },
      inUseByCategory: {
        camera: categoryInUse['camera'] || 0,
        audio: categoryInUse['audio'] || 0,
        lighting: categoryInUse['lighting'] || 0,
        accessories: categoryInUse['accessories'] || 0,
        storage: categoryInUse['storage'] || 0,
      },
      byItemType: {
        main: mainItems,
        accessory: accessories,
      },
      available,
      inUse,
      maintenance,
      mainItems,
      accessories,
      totalValue: enrichedEquipment.reduce((acc, eq) => acc + (eq.value || 0), 0),
      valueByCategory: enrichedEquipment.reduce((acc, eq) => {
        const category = eq.category.toLowerCase();
        acc[category as EquipmentCategory] = (acc[category as EquipmentCategory] || 0) + (eq.value || 0);
        return acc;
      }, {} as Record<EquipmentCategory, number>),
    };
  }, [enrichedEquipment]);

  const addEquipment = async (newEquipment: Omit<Equipment, 'id'>): Promise<Result<Equipment>> => {
    const result = await wrapAsync(async () => {
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
        invoice: newEquipment.invoice || null,
        capacity: newEquipment.capacity || null
      };

      const { data, error } = await supabase
        .from('equipments')
        .insert([dbEquipment])
        .select()
        .single();

      if (error) {
        throw createDatabaseError('Erro ao adicionar equipamento', error.message);
      }

      if (!data) {
        throw createDatabaseError('Nenhum dado retornado após inserção');
      }

      const equipmentData: Equipment = {
        id: data.id,
        name: data.name,
        brand: data.brand,
        category: data.category as Equipment['category'],
        subcategory: data.subcategory,
        customCategory: data.custom_category,
        status: data.status as Equipment['status'],
        itemType: (data.item_type || 'main') as Equipment['itemType'],
        parentId: data.parent_id,
        isExpanded: false,
        serialNumber: data.serial_number,
        purchaseDate: data.purchase_date,
        lastMaintenance: data.last_maintenance,
        description: data.description,
        image: data.image,
        value: data.value ? Number(data.value) : undefined,
        patrimonyNumber: data.patrimony_number,
        depreciatedValue: data.depreciated_value ? Number(data.depreciated_value) : undefined,
        receiveDate: data.receive_date,
        store: data.store,
        invoice: data.invoice,
        currentLoanId: data.current_loan_id,
        currentBorrower: data.current_borrower,
        lastLoanDate: data.last_loan_date,
        capacity: data.capacity ? Number(data.capacity) : undefined
      };
      
      setEquipment(prev => [...prev, equipmentData]);
      logger.userAction('equipment_created', JSON.stringify({ equipmentId: data.id, name: data.name }));
      
      return equipmentData;
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }
    return { success: true, data: result.data };
  };

  const updateEquipment = async (id: string, updates: Partial<Equipment>): Promise<Result<void>> => {
    const result = await wrapAsync(async () => {
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
        last_loan_date: updates.lastLoanDate,
        capacity: updates.capacity
      };

      // Remove undefined values
      const cleanedUpdates = Object.fromEntries(
        Object.entries(dbUpdates).filter(([, value]) => value !== undefined)
      );

      const { error } = await supabase
        .from('equipments')
        .update(cleanedUpdates)
        .eq('id', id);

      if (error) {
        throw createDatabaseError('Erro ao atualizar equipamento', error.message);
      }

      setEquipment(prev => 
        prev.map(item => item.id === id ? { ...item, ...updates } : item)
      );

      logger.userAction('equipment_updated', JSON.stringify({ equipmentId: id }));
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }
    return { success: true, data: undefined };
  };

  const deleteEquipment = async (id: string): Promise<Result<void>> => {
    const result = await wrapAsync(async () => {
      const { error } = await supabase
        .from('equipments')
        .delete()
        .eq('id', id);

      if (error) {
        throw createDatabaseError('Erro ao deletar equipamento', error.message);
      }

      setEquipment(prev => prev.filter(item => item.id !== id));
      logger.userAction('equipment_deleted', JSON.stringify({ equipmentId: id }));
    });

    return result.data !== undefined 
      ? { success: true, data: undefined } 
      : { success: false, error: result.error?.message || 'Erro desconhecido' };
  };

  const convertToAccessory = async (equipmentId: string, parentId: string): Promise<Result<void>> => {
    const result = await wrapAsync(async () => {
      // First, check if the equipment has accessories attached to it
      const equipmentToConvert = equipment.find(item => item.id === equipmentId);
      if (!equipmentToConvert) {
        throw createValidationError('Equipment not found');
      }

      // Check if this equipment has accessories (it's a main item with accessories)
      const hasAccessories = equipment.some(item => item.parentId === equipmentId);
      if (hasAccessories) {
        throw createValidationError('Cannot convert equipment that has accessories attached. Please convert or reassign accessories first.');
      }

      // Validate that the parent exists and is a main item
      const parentItem = equipment.find(item => item.id === parentId);
      if (!parentItem) {
        throw createValidationError('Parent item not found');
      }
      if (parentItem.itemType !== 'main') {
        throw createValidationError('Parent item must be a main equipment item');
      }

      // Update the equipment to be an accessory
      const { error } = await supabase
        .from('equipments')
        .update({
          item_type: 'accessory',
          parent_id: parentId
        })
        .eq('id', equipmentId);

      if (error) {
        throw createDatabaseError('Erro ao converter para acessório', error.message);
      }

      // Update local state
      setEquipment(prev => 
        prev.map(item => 
          item.id === equipmentId 
            ? { ...item, itemType: 'accessory', parentId: parentId }
            : item
        )
      );

      logger.userAction('equipment_converted_to_accessory', JSON.stringify({ equipmentId, parentId }));
    });

    return result.data !== undefined 
      ? { success: true, data: undefined } 
      : { success: false, error: result.error?.message || 'Erro desconhecido' };
  };

  const importEquipment = async (importedEquipment: Omit<Equipment, 'id'>[]): Promise<Result<Equipment[]>> => {
    const result = await wrapAsync(async () => {
      logger.info(`Starting import process with ${importedEquipment.length} items`);
      
      // Separate main items and accessories for proper processing
      const mainItems = importedEquipment.filter(item => item.itemType === 'main');
      
      logger.info(`Processing ${mainItems.length} main items`);
      
      const allInsertedItems: Equipment[] = [];
      
      // Step 1: Insert main items first
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
          throw createDatabaseError(`Erro ao inserir itens principais: ${mainError.message}`);
        }

        if (mainData) {
          const transformedMainItems = mainData.map(item => ({
            id: item.id,
            name: item.name,
            brand: item.brand,
            category: item.category as Equipment['category'],
            status: item.status as Equipment['status'],
            itemType: (item.item_type || 'main') as Equipment['itemType'],
            parentId: item.parent_id,
            isExpanded: false,
            serialNumber: item.serial_number,
            purchaseDate: item.purchase_date,
            lastMaintenance: item.last_maintenance,
            description: item.description,
            image: item.image,
            value: item.value ? Number(item.value) : undefined,
            patrimonyNumber: item.patrimony_number,
            depreciatedValue: item.depreciated_value ? Number(item.depreciated_value) : undefined,
            receiveDate: item.receive_date,
            store: item.store,
            invoice: item.invoice
          })) as Equipment[];
          
          allInsertedItems.push(...transformedMainItems);
        }
      }
      
      // Update local state with all inserted items
      setEquipment(prev => [...prev, ...allInsertedItems]);
      
      logger.info(`Import completed successfully. Imported ${allInsertedItems.length} items`);
      return allInsertedItems;
    });

    return result.data 
      ? { success: true, data: result.data } 
      : { success: false, error: result.error?.message || 'Erro na importação' };
  };

  const toggleEquipmentExpansion = (id: string) => {
    setEquipment(prev => 
      prev.map(item => {
        if (item.id === id) {
          return { ...item, isExpanded: !item.isExpanded };
        }
        return item;
      })
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
    enrichedEquipment,
    filteredEquipment,
    equipmentHierarchy,
    unlinkedAccessories,
    stats,
    filters,
    loading,
    error,
    allEquipment: enrichedEquipment,
    setFilters,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    convertToAccessory,
    importEquipment,
    toggleEquipmentExpansion,
    getMainItems,
    handleSort,
    clearSort,
    fetchEquipment
  };
}
