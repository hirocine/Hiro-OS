import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Equipment, EquipmentFilters, DashboardStats, EquipmentHierarchy, SortableField, SortOrder, EquipmentCategory, EquipmentStatus, EquipmentItemType } from '@/types/equipment';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { createDatabaseError, createValidationError, wrapAsync } from '@/lib/errors';
import type { Result } from '@/types/common';
import { queryKeys } from '@/lib/queryClient';
import { useAuthContext } from '@/contexts/AuthContext';

interface UseEquipmentReturn {
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
  setFilters: React.Dispatch<React.SetStateAction<EquipmentFilters>>;
  addEquipment: (newEquipment: Omit<Equipment, 'id'>) => Promise<Result<Equipment>>;
  updateEquipment: (id: string, updates: Partial<Equipment>) => Promise<Result<void>>;
  deleteEquipment: (id: string) => Promise<Result<void>>;
  convertToAccessory: (equipmentId: string, parentId: string) => Promise<Result<void>>;
  importEquipment: (equipment: Omit<Equipment, 'id'>[]) => Promise<Result<{ equipment: Equipment[], summary: any }>>;
  toggleEquipmentExpansion: (id: string) => void;
  getMainItems: () => Equipment[];
  handleSort: (field: SortableField, order: SortOrder) => void;
  clearSort: () => void;
  fetchEquipment: () => void;
}

export function useEquipment(): UseEquipmentReturn {
  const [filters, setFilters] = useState<EquipmentFilters>({
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();
  const { logAuditEntry } = useAuthContext();

  // Fetch equipment usando React Query
  const { data: equipment = [], isLoading, error: queryError } = useQuery({
    queryKey: queryKeys.equipment.all,
    queryFn: async () => {
      logger.apiCall('GET', '/equipments');
      
      const { data, error } = await supabase
        .from('equipments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.database('select', 'equipments', false, error);
        throw createDatabaseError('Erro ao buscar equipamentos', error.message);
      }

      logger.database('select', 'equipments', true);
      logger.apiResponse('GET', '/equipments', true, { count: data?.length || 0 });

      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        category: item.category as Equipment['category'],
        subcategory: item.subcategory,
        customCategory: item.custom_category,
        status: item.status as Equipment['status'],
        simplifiedStatus: item.simplified_status as 'available' | 'in_project' | undefined,
        itemType: (item.item_type || 'main') as Equipment['itemType'],
        parentId: item.parent_id,
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
        invoice: item.invoice,
        currentLoanId: item.current_loan_id,
        currentBorrower: item.current_borrower,
        lastLoanDate: item.last_loan_date,
        expectedReturnDate: item.expected_return_date,
        capacity: item.capacity ? Number(item.capacity) : undefined,
        displayOrder: item.display_order,
        internal_user_id: item.internal_user_id
      })) as Equipment[];
    }
  });

  // Real-time subscription para sincronização automática
  useEffect(() => {
    const channel = supabase
      .channel('equipments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipments'
        },
        (payload) => {
          logger.debug('Equipment real-time update received', { 
            module: 'equipment', 
            data: { event: payload.eventType } 
          });
          queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const enrichedEquipment = useMemo((): Array<Equipment & { hasAccessories: boolean; isExpanded: boolean }> => {
    return equipment.map(item => {
      const hasAccessories = equipment.some(eq => eq.parentId === item.id);
      const isExpanded = expandedItems[item.id] ?? false;
      
      return {
        ...item,
        hasAccessories,
        isExpanded
      };
    });
  }, [equipment, expandedItems]);

  const sortEquipment = useCallback(<T extends Equipment>(items: T[], field: SortableField, order: SortOrder): T[] => {
    return [...items].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return order === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return order === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      return 0;
    });
  }, []);

  const filteredEquipment = useMemo(() => {
    let filtered = enrichedEquipment.filter(item => {
      if (filters.category && item.category !== filters.category) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (filters.itemType && item.itemType !== filters.itemType) return false;
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = (
          item.name?.toLowerCase().includes(searchTerm) ||
          item.brand?.toLowerCase().includes(searchTerm) ||
          item.serialNumber?.toLowerCase().includes(searchTerm) ||
          item.description?.toLowerCase().includes(searchTerm) ||
          item.category?.toLowerCase().includes(searchTerm)
        );
        if (!matchesSearch) return false;
      }
      
      return true;
    });

    if (filters.sortBy && filters.sortOrder) {
      filtered = sortEquipment(filtered, filters.sortBy, filters.sortOrder);
    }

    return filtered;
  }, [enrichedEquipment, filters, sortEquipment]);

  const equipmentHierarchy = useMemo((): EquipmentHierarchy[] => {
    const mainItems = filteredEquipment.filter(item => item.itemType === 'main');
    const accessories = filteredEquipment.filter(item => item.itemType === 'accessory');
    
    return mainItems.map(mainItem => {
      const itemAccessories = accessories.filter(acc => acc.parentId === mainItem.id);
      const hasAccessories = itemAccessories.length > 0;
      const isExpanded = mainItem.isExpanded ?? (hasAccessories ? true : false);
      
      return {
        item: { 
          ...mainItem, 
          hasAccessories: hasAccessories,
          isExpanded: isExpanded
        },
        accessories: itemAccessories
      } as EquipmentHierarchy;
    });
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
      const category = eq.category?.toLowerCase() || 'sem-categoria';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;

      if (eq.simplifiedStatus === 'in_project') {
        categoryInUse[category] = (categoryInUse[category] || 0) + 1;
      }

      if (eq.itemType === 'main') mainItems++;
      else accessories++;
    });

    const inProject = enrichedEquipment.filter(eq => eq.simplifiedStatus === 'in_project').length;
    const available = enrichedEquipment.filter(eq => eq.simplifiedStatus === 'available' && eq.status !== 'maintenance').length;
    const inUse = enrichedEquipment.filter(eq => eq.currentLoanId !== null && eq.simplifiedStatus === 'in_project').length;
    const maintenance = enrichedEquipment.filter(eq => eq.status === 'maintenance').length;

    return {
      total: enrichedEquipment.length,
      byCategory: categoryCounts as Record<EquipmentCategory, number>,
      inUseByCategory: categoryInUse as Record<EquipmentCategory, number>,
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
        const category = eq.category?.toLowerCase() || 'sem-categoria';
        acc[category as EquipmentCategory] = (acc[category as EquipmentCategory] || 0) + (eq.value || 0);
        return acc;
      }, {} as Record<EquipmentCategory, number>),
    };
  }, [enrichedEquipment]);

  // Mutations
  const addMutation = useMutation({
    mutationFn: async (newEquipment: Omit<Equipment, 'id'>) => {
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

      if (error) throw createDatabaseError('Erro ao adicionar equipamento', error.message);
      if (!data) throw createDatabaseError('Nenhum dado retornado após inserção');

      await logAuditEntry('create_equipment', 'equipments', data.id, undefined, {
        name: data.name,
        category: data.category,
        brand: data.brand,
        status: data.status
      });

      return {
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
      } as Equipment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Equipment> }) => {
      const camelToSnake: Record<string, string> = {
        customCategory: 'custom_category',
        itemType: 'item_type',
        parentId: 'parent_id',
        serialNumber: 'serial_number',
        purchaseDate: 'purchase_date',
        lastMaintenance: 'last_maintenance',
        patrimonyNumber: 'patrimony_number',
        depreciatedValue: 'depreciated_value',
        receiveDate: 'receive_date',
        currentLoanId: 'current_loan_id',
        currentBorrower: 'current_borrower',
        lastLoanDate: 'last_loan_date',
        expectedReturnDate: 'expected_return_date',
        simplifiedStatus: 'simplified_status',
        displayOrder: 'display_order',
        internal_user_id: 'internal_user_id',
      };

      const virtualFields = ['hasAccessories', 'isExpanded'];
      const cleanedUpdates: Record<string, any> = {};
      
      for (const [camelKey, value] of Object.entries(updates)) {
        if (virtualFields.includes(camelKey)) continue;
        const dbKey = camelToSnake[camelKey] ?? camelKey;
        cleanedUpdates[dbKey] = (value === undefined || value === '') ? null : value;
      }

      if (Object.keys(cleanedUpdates).length === 0) {
        throw createValidationError('Nenhuma alteração detectada');
      }

      const { data, error } = await supabase
        .from('equipments')
        .update(cleanedUpdates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw createDatabaseError(`Erro ao atualizar equipamento: ${error.message}`, 'update', 'equipments');
      if (!data) throw createDatabaseError('Nenhum dado retornado após atualização', 'update', 'equipments');

      const oldEquipment = equipment.find(eq => eq.id === id);
      await logAuditEntry('update_equipment', 'equipments', id, 
        oldEquipment ? { name: oldEquipment.name, category: oldEquipment.category, status: oldEquipment.status } : undefined,
        updates
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const deletedEquipment = equipment.find(eq => eq.id === id);
      
      const { error } = await supabase
        .from('equipments')
        .delete()
        .eq('id', id);

      if (error) throw createDatabaseError('Erro ao deletar equipamento', error.message);

      await logAuditEntry('delete_equipment', 'equipments', id,
        deletedEquipment ? { name: deletedEquipment.name, category: deletedEquipment.category } : undefined,
        undefined
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
    }
  });

  // Helper functions
  const addEquipment = async (newEquipment: Omit<Equipment, 'id'>): Promise<Result<Equipment>> => {
    const result = await wrapAsync(() => addMutation.mutateAsync(newEquipment));
    return result.error ? { success: false, error: result.error.message } : { success: true, data: result.data };
  };

  const updateEquipment = async (id: string, updates: Partial<Equipment>): Promise<Result<void>> => {
    const result = await wrapAsync(() => updateMutation.mutateAsync({ id, updates }));
    return result.error ? { success: false, error: result.error.message } : { success: true, data: undefined };
  };

  const deleteEquipment = async (id: string): Promise<Result<void>> => {
    const result = await wrapAsync(() => deleteMutation.mutateAsync(id));
    return result.error ? { success: false, error: result.error.message } : { success: true, data: undefined };
  };

  const convertToAccessory = async (equipmentId: string, parentId: string): Promise<Result<void>> => {
    return updateEquipment(equipmentId, { itemType: 'accessory', parentId });
  };

  const importEquipment = async (importedEquipment: Omit<Equipment, 'id'>[]): Promise<Result<{ equipment: Equipment[], summary: any }>> => {
    const result = await wrapAsync(async () => {
      const mainItems = importedEquipment.filter(item => item.itemType === 'main');
      const accessories = importedEquipment.filter(item => item.itemType === 'accessory');
      
      const summary = {
        totalParsed: importedEquipment.length,
        mainsNew: 0,
        accessoriesNew: 0,
        mainsExisting: 0,
        accessoriesExisting: 0,
        skippedMissingParent: 0,
        errors: [] as string[]
      };

      // PASSO 1: Pré-buscar equipamentos existentes
      const allPatrimonies = importedEquipment
        .map(item => item.patrimonyNumber)
        .filter(Boolean) as string[];
      
      const { data: existingEquipments, error: fetchError } = await supabase
        .from('equipments')
        .select('id, patrimony_number, item_type')
        .in('patrimony_number', allPatrimonies);
      
      if (fetchError) throw createDatabaseError(`Erro ao buscar equipamentos existentes: ${fetchError.message}`);

      // Criar mapa de patrimônios existentes
      const existingPatrimonyMap = new Map<string, { id: string; item_type: string }>();
      existingEquipments?.forEach(eq => {
        if (eq.patrimony_number) {
          existingPatrimonyMap.set(eq.patrimony_number, { id: eq.id, item_type: eq.item_type });
        }
      });

      // PASSO 2: Particionar itens
      const mainToInsert = mainItems.filter(item => 
        !item.patrimonyNumber || !existingPatrimonyMap.has(item.patrimonyNumber)
      );
      const mainExisting = mainItems.filter(item => 
        item.patrimonyNumber && existingPatrimonyMap.has(item.patrimonyNumber)
      );
      
      summary.mainsExisting = mainExisting.length;

      const allInsertedItems: Equipment[] = [];

      // PASSO 3: Inserir itens principais novos
      if (mainToInsert.length > 0) {
        const dbMainItems = mainToInsert.map(item => ({
          name: item.name,
          brand: item.brand,
          category: item.category,
          status: item.status,
          item_type: item.itemType,
          parent_id: null,
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
          invoice: item.invoice || null,
          subcategory: item.subcategory || null,
          custom_category: item.customCategory || null,
          capacity: item.capacity || null
        }));

        const { data: mainData, error: mainError } = await supabase
          .from('equipments')
          .insert(dbMainItems)
          .select();

        if (mainError) {
          // Se erro é de unicidade, contar como existentes
          if (mainError.code === '23505') {
            summary.mainsExisting += mainToInsert.length;
            summary.errors.push('Alguns itens principais já existiam no banco');
          } else {
            throw createDatabaseError(`Erro ao inserir itens principais: ${mainError.message}`);
          }
        } else if (mainData) {
          summary.mainsNew = mainData.length;
          allInsertedItems.push(...mainData.map(item => ({
            id: item.id,
            name: item.name,
            brand: item.brand,
            category: item.category as Equipment['category'],
            subcategory: item.subcategory,
            customCategory: item.custom_category,
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
            invoice: item.invoice,
            capacity: item.capacity ? Number(item.capacity) : undefined
          })) as Equipment[]);

          // Atualizar mapa com novos IDs
          mainData.forEach(item => {
            if (item.patrimony_number) {
              existingPatrimonyMap.set(item.patrimony_number, { id: item.id, item_type: item.item_type });
            }
          });
        }
      }

      // PASSO 4: Processar acessórios
      const accessoryToInsert: any[] = [];
      const accessoryExisting = accessories.filter(item => 
        item.patrimonyNumber && existingPatrimonyMap.has(item.patrimonyNumber)
      );
      
      summary.accessoriesExisting = accessoryExisting.length;

      accessories.forEach(item => {
        // Ignorar se já existe
        if (item.patrimonyNumber && existingPatrimonyMap.has(item.patrimonyNumber)) {
          return;
        }

        // Resolver parent_id
        let realParentId: string | null = null;
        
        if (item.patrimonyNumber) {
          const match = item.patrimonyNumber.match(/^(.+)\.\d+$/);
          if (match) {
            const parentPatrimony = `${match[1]}.0`;
            const parentData = existingPatrimonyMap.get(parentPatrimony);
            if (parentData) {
              realParentId = parentData.id;
            }
          }
        }

        // Se não encontrou pai, pular
        if (!realParentId) {
          summary.skippedMissingParent++;
          summary.errors.push(`Acessório ${item.patrimonyNumber || item.name} pulado: item principal não encontrado`);
          return;
        }

        accessoryToInsert.push({
          name: item.name,
          brand: item.brand,
          category: item.category,
          status: item.status,
          item_type: item.itemType,
          parent_id: realParentId,
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
          invoice: item.invoice || null,
          subcategory: item.subcategory || null,
          custom_category: item.customCategory || null,
          capacity: item.capacity || null
        });
      });

      // PASSO 5: Inserir acessórios
      if (accessoryToInsert.length > 0) {
        const { data: accessoriesData, error: accessoriesError } = await supabase
          .from('equipments')
          .insert(accessoryToInsert)
          .select();

        if (accessoriesError) {
          if (accessoriesError.code === '23505') {
            summary.accessoriesExisting += accessoryToInsert.length;
            summary.errors.push('Alguns acessórios já existiam no banco');
          } else {
            summary.errors.push(`Erro ao inserir acessórios: ${accessoriesError.message}`);
          }
        } else if (accessoriesData) {
          summary.accessoriesNew = accessoriesData.length;
          allInsertedItems.push(...accessoriesData.map(item => ({
            id: item.id,
            name: item.name,
            brand: item.brand,
            category: item.category as Equipment['category'],
            subcategory: item.subcategory,
            customCategory: item.custom_category,
            status: item.status as Equipment['status'],
            itemType: (item.item_type || 'accessory') as Equipment['itemType'],
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
            invoice: item.invoice,
            capacity: item.capacity ? Number(item.capacity) : undefined
          })) as Equipment[]);
        }
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
      return { equipment: allInsertedItems, summary };
    });

    return result.data 
      ? { success: true, data: result.data } 
      : { success: false, error: result.error?.message || 'Erro na importação' };
  };

  const toggleEquipmentExpansion = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getMainItems = () => enrichedEquipment.filter(item => item.itemType === 'main');

  const handleSort = (field: SortableField, order: SortOrder) => {
    setFilters(prev => ({ ...prev, sortBy: field, sortOrder: order }));
  };

  const clearSort = () => {
    setFilters(prev => ({ ...prev, sortBy: undefined, sortOrder: undefined }));
  };

  return {
    equipment: filteredEquipment,
    enrichedEquipment,
    filteredEquipment,
    equipmentHierarchy,
    unlinkedAccessories,
    stats,
    filters,
    loading: isLoading,
    error: queryError?.message || null,
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
    fetchEquipment: () => queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all })
  };
}
