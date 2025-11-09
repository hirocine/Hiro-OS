import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EquipmentCategoryData, CategoryHierarchy } from '@/types/equipment';
import { logger } from '@/lib/logger';
import { handleLegacyError, DatabaseError, wrapAsync } from '@/lib/errors';
import type { Result } from '@/types/common';
import type { EquipmentCategoryDbRow } from '@/types/database';
import { normalizeString } from '@/lib/categoryMapping';

export function useCategories() {
  const [categories, setCategories] = useState<EquipmentCategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    logger.apiCall('GET', '/equipment_categories');
    
    const result = await wrapAsync(async () => {
      const { data, error } = await supabase
        .from('equipment_categories')
        .select('*')
        .order('category_order', { ascending: true })
        .order('subcategory_order', { ascending: true });

      if (error) {
        logger.database('select', 'equipment_categories', false, error);
        throw new DatabaseError(`Failed to fetch categories: ${error.message}`, 'select', 'equipment_categories');
      }

      const categoriesData: EquipmentCategoryData[] = (data as EquipmentCategoryDbRow[]).map(item => ({
        id: item.id,
        category: item.category,
        subcategory: item.subcategory,
        isCustom: item.is_custom,
        createdAt: item.created_at,
        createdBy: item.created_by,
        categoryOrder: item.category_order,
        subcategoryOrder: item.subcategory_order
      }));

      logger.database('select', 'equipment_categories', true);
      logger.apiResponse('GET', '/equipment_categories', true, { count: categoriesData.length });
      
      setCategories(categoriesData);
      return categoriesData;
    });

    if (result.error) {
      logger.error('Failed to fetch categories', { 
        module: 'categories', 
        error: result.error.message 
      });
    }
    
    setLoading(false);
  };

  const addCustomCategory = async (category: string, subcategory: string | null): Promise<Result<EquipmentCategoryData>> => {
    logger.userAction('create_custom_category', undefined, { category, subcategory });
    
    const result = await wrapAsync(async () => {
      const categoryData = {
        category,
        subcategory,
        is_custom: true,
        category_order: 999,
        subcategory_order: 999
      };

      const { data, error } = await supabase
        .from('equipment_categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) {
        logger.database('insert', 'equipment_categories', false, error);
        throw new DatabaseError(`Failed to create custom category: ${error.message}`, 'insert', 'equipment_categories');
      }

      const newCategory: EquipmentCategoryData = {
        id: data.id,
        category: data.category,
        subcategory: data.subcategory,
        isCustom: data.is_custom,
        createdAt: data.created_at,
        createdBy: data.created_by,
        categoryOrder: data.category_order,
        subcategoryOrder: data.subcategory_order
      };

      setCategories(prev => [...prev, newCategory]);
      logger.database('insert', 'equipment_categories', true);
      
      return newCategory;
    });

    return result.error 
      ? { success: false, error: result.error.message }
      : { success: true, data: result.data! };
  };

  const getCategoriesHierarchy = (): CategoryHierarchy[] => {
    const grouped = categories.reduce((acc, cat) => {
      if (!acc[cat.category]) {
        acc[cat.category] = {
          categoryName: cat.category,
          categoryId: null,
          isCustom: cat.isCustom,
          subcategories: []
        };
      }
      
      if (cat.subcategory) {
        acc[cat.category].subcategories.push({
          id: cat.id,
          name: cat.subcategory,
          isCustom: cat.isCustom,
          usageCount: 0,
          order: cat.subcategoryOrder || 999
        });
      } else {
        acc[cat.category].categoryId = cat.id;
        acc[cat.category].isCustom = cat.isCustom;
      }
      
      return acc;
    }, {} as Record<string, CategoryHierarchy>);
    
    // Sort subcategories by order
    Object.values(grouped).forEach(cat => {
      cat.subcategories.sort((a, b) => a.order - b.order);
    });
    
    return Object.values(grouped);
  };

  const addCategoryOnly = async (categoryName: string): Promise<Result<EquipmentCategoryData>> => {
    return addCustomCategory(categoryName, null);
  };

  const addSubcategory = async (
    categoryName: string, 
    subcategoryName: string
  ): Promise<Result<EquipmentCategoryData>> => {
    return addCustomCategory(categoryName, subcategoryName);
  };

  const renameCategory = async (
    oldCategoryName: string, 
    newCategoryName: string
  ): Promise<Result<void>> => {
    logger.userAction('rename_category', undefined, { oldCategoryName, newCategoryName });
    
    const result = await wrapAsync(async () => {
      const { error } = await supabase
        .from('equipment_categories')
        .update({ category: newCategoryName })
        .eq('category', oldCategoryName);
      
      if (error) {
        logger.database('update', 'equipment_categories', false, error);
        throw new DatabaseError(`Failed to rename category: ${error.message}`, 'update', 'equipment_categories');
      }

      await supabase
        .from('equipments')
        .update({ category: newCategoryName })
        .eq('category', oldCategoryName);

      await fetchCategories();
      logger.database('update', 'equipment_categories', true);
    });

    return result.error 
      ? { success: false, error: result.error.message }
      : { success: true, data: undefined };
  };

  const deleteSubcategory = async (subcategoryId: string): Promise<Result<void>> => {
    return deleteCategory(subcategoryId);
  };

  const deleteCategoryWithSubcategories = async (
    categoryName: string
  ): Promise<Result<void>> => {
    logger.userAction('delete_category_with_subcategories', undefined, { categoryName });
    
    const result = await wrapAsync(async () => {
      const { count } = await supabase
        .from('equipments')
        .select('*', { count: 'exact', head: true })
        .eq('category', categoryName);
      
      if (count && count > 0) {
        throw new DatabaseError(
          `Não é possível deletar. ${count} equipamentos usam esta categoria.`,
          'delete',
          'equipment_categories'
        );
      }

      const { error } = await supabase
        .from('equipment_categories')
        .delete()
        .eq('category', categoryName);
      
      if (error) {
        logger.database('delete', 'equipment_categories', false, error);
        throw new DatabaseError(`Failed to delete category: ${error.message}`, 'delete', 'equipment_categories');
      }

      setCategories(prev => prev.filter(cat => cat.category !== categoryName));
      logger.database('delete', 'equipment_categories', true);
    });

    return result.error 
      ? { success: false, error: result.error.message }
      : { success: true, data: undefined };
  };

  const getSubcategoriesForCategory = (categoryKey: string) => {
    return categories
      .filter(cat => cat.category === categoryKey)
      .map(cat => cat.subcategory);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const updateCategory = async (
    categoryId: string,
    newCategory: string,
    newSubcategory: string
  ): Promise<Result<EquipmentCategoryData>> => {
    logger.userAction('update_category', undefined, { categoryId, newCategory, newSubcategory });
    
    const result = await wrapAsync(async () => {
      const { data, error } = await supabase
        .from('equipment_categories')
        .update({
          category: newCategory,
          subcategory: newSubcategory
        })
        .eq('id', categoryId)
        .select()
        .single();

      if (error) {
        logger.database('update', 'equipment_categories', false, error);
        throw new DatabaseError(`Failed to update category: ${error.message}`, 'update', 'equipment_categories');
      }

      const updatedCategory: EquipmentCategoryData = {
        id: data.id,
        category: data.category,
        subcategory: data.subcategory,
        isCustom: data.is_custom,
        createdAt: data.created_at,
        createdBy: data.created_by,
        categoryOrder: data.category_order,
        subcategoryOrder: data.subcategory_order
      };

      setCategories(prev => prev.map(cat => cat.id === categoryId ? updatedCategory : cat));
      logger.database('update', 'equipment_categories', true);
      
      return updatedCategory;
    });

    return result.error 
      ? { success: false, error: result.error.message }
      : { success: true, data: result.data! };
  };

  const deleteCategory = async (categoryId: string): Promise<Result<void>> => {
    logger.userAction('delete_category', undefined, { categoryId });
    
    const result = await wrapAsync(async () => {
      const { error } = await supabase
        .from('equipment_categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        logger.database('delete', 'equipment_categories', false, error);
        throw new DatabaseError(`Failed to delete category: ${error.message}`, 'delete', 'equipment_categories');
      }

      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      logger.database('delete', 'equipment_categories', true);
    });

    return result.error 
      ? { success: false, error: result.error.message }
      : { success: true, data: undefined };
  };

  const getCategoryUsageCount = async (category: string, subcategory: string): Promise<number> => {
    const { data, error } = await supabase
      .from('equipments')
      .select('id', { count: 'exact', head: true })
      .eq('category', category)
      .eq('subcategory', subcategory);

    if (error) {
      logger.error('Failed to get category usage count', { 
        module: 'categories', 
        error: error.message 
      });
      return 0;
    }

    return data?.length || 0;
  };

  const reorderSubcategory = async (
    subcategoryId: string,
    categoryName: string,
    direction: 'up' | 'down'
  ): Promise<Result<void>> => {
    logger.userAction('reorder_subcategory', undefined, { subcategoryId, direction });
    
    const result = await wrapAsync(async () => {
      // Get all subcategories for this category
      const categorySubs = categories
        .filter(cat => cat.category === categoryName && cat.subcategory)
        .sort((a, b) => (a.subcategoryOrder || 999) - (b.subcategoryOrder || 999));

      const currentIndex = categorySubs.findIndex(cat => cat.id === subcategoryId);
      if (currentIndex === -1) {
        throw new DatabaseError('Subcategory not found', 'update', 'equipment_categories');
      }

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (targetIndex < 0 || targetIndex >= categorySubs.length) {
        throw new DatabaseError('Cannot move in that direction', 'update', 'equipment_categories');
      }

      const currentSub = categorySubs[currentIndex];
      const targetSub = categorySubs[targetIndex];

      // Swap orders
      const currentOrder = currentSub.subcategoryOrder || 999;
      const targetOrder = targetSub.subcategoryOrder || 999;

      await supabase
        .from('equipment_categories')
        .update({ subcategory_order: targetOrder })
        .eq('id', currentSub.id);

      await supabase
        .from('equipment_categories')
        .update({ subcategory_order: currentOrder })
        .eq('id', targetSub.id);

      await fetchCategories();
      logger.database('update', 'equipment_categories', true);
    });

    return result.error 
      ? { success: false, error: result.error.message }
      : { success: true, data: undefined };
  };

  /**
   * Sincroniza as ordens do banco de dados com as definições do categoryMapping.ts
   */
  const syncOrdersWithMapping = async (): Promise<Result<void>> => {
    try {
      const { PARENT_CATEGORIES } = await import('@/lib/categoryMapping');
      const updates: Array<{ id: string; subcategory_order: number }> = [];
      let insertedCount = 0;

      logger.info('Sync orders - start', { module: 'categories' });
      // Para cada categoria no mapping
      for (const parentCat of PARENT_CATEGORIES) {
        for (const subcat of parentCat.subcategories) {
          // Encontrar TODAS as entradas no banco que fazem match normalizado
          const dbEntries = categories.filter(
            cat => normalizeString(cat.category) === normalizeString(parentCat.key) && 
                   normalizeString(cat.subcategory || '') === normalizeString(subcat.key)
          );

          logger.debug('Sync match result', {
            module: 'categories',
            data: { parent: parentCat.key, sub: subcat.key, found: dbEntries.length }
          });
          
          if (dbEntries.length > 0) {
            // Atualizar TODAS as entradas que fazem match
            for (const dbEntry of dbEntries) {
              const needsUpdate = (dbEntry.subcategoryOrder ?? 999) !== subcat.order;
              if (needsUpdate) {
                updates.push({ id: dbEntry.id, subcategory_order: subcat.order });
              }
            }
          } else {
            // Se não existir no banco, criar a entrada canônica
            const { error: insertError } = await supabase
              .from('equipment_categories')
              .insert([{
                category: parentCat.title, // usar título canônico PT-BR
                subcategory: subcat.name,
                subcategory_order: subcat.order,
                category_order: parentCat.order,
                is_custom: false
              }]);
            
            if (insertError) {
              logger.error('Error inserting missing category', { error: insertError });
            } else {
              insertedCount += 1;
            }
          }
        }
      }

      // Executar atualizações em lote agrupadas por ordem
      const byOrder: Record<number, string[]> = {};
      for (const u of updates) {
        byOrder[u.subcategory_order] ||= [];
        byOrder[u.subcategory_order].push(u.id);
      }

      let batchCount = 0;
      for (const [orderStr, ids] of Object.entries(byOrder)) {
        const order = Number(orderStr);
        const { error: updateError } = await supabase
          .from('equipment_categories')
          .update({ subcategory_order: order })
          .in('id', ids);
        batchCount += 1;
        if (updateError) {
          logger.error('Error updating category order batch', { error: updateError, data: { order, ids: ids.length } });
        } else {
          logger.debug('Updated category order batch', { module: 'categories', data: { order, count: ids.length } });
        }
      }

      logger.info('Sync orders - done', { module: 'categories', data: { updates: updates.length, batches: batchCount, inserted: insertedCount } });
      
      // Refetch após sincronização
      await fetchCategories();
      
      return { success: true, data: undefined };
    } catch (error) {
      logger.error('Error syncing orders with mapping', { error });
      return { success: false, error: 'Erro ao sincronizar ordens' };
    }
  };

  // Limpa entradas duplicadas de categorias/subcategorias (normalização) e migra equipamentos
  const cleanDuplicateCategories = async (): Promise<Result<{ removed: number; updatedEquipments: number }>> => {
    try {
      logger.info('Clean duplicates - start', { module: 'categories' });

      // Buscar do banco para garantir dados mais recentes
      const { data, error } = await supabase
        .from('equipment_categories')
        .select('*');
      if (error) {
        logger.error('Failed to fetch categories for cleanup', { error });
        return { success: false, error: 'Falha ao buscar categorias para limpeza' };
      }

      // Tipar registros
      const rows = (data as EquipmentCategoryDbRow[]).map(item => ({
        id: item.id,
        category: item.category,
        subcategory: item.subcategory,
        isCustom: item.is_custom,
        createdAt: item.created_at,
        createdBy: item.created_by,
        categoryOrder: item.category_order,
        subcategoryOrder: item.subcategory_order
      })) as EquipmentCategoryData[];

      // Agrupar por categoria/subcategoria normalizada (apenas subcategorias, foco do problema)
      const groups = new Map<string, EquipmentCategoryData[]>();
      for (const r of rows) {
        if (!r.subcategory) continue; // focar em subcategorias
        const key = `${normalizeString(r.category)}::${normalizeString(r.subcategory)}`;
        const arr = groups.get(key) || [];
        arr.push(r);
        groups.set(key, arr);
      }

      // Carregar mapping
      const { PARENT_CATEGORIES } = await import('@/lib/categoryMapping');

      const losersToDelete: string[] = [];
      let updatedEquipments = 0;

      // Processar cada grupo
      for (const [key, items] of groups) {
        if (items.length <= 1) continue; // não há duplicados
        const [normCat, normSub] = key.split('::');

        // Encontrar categoria/subcategoria canônica no mapping
        const parent = PARENT_CATEGORIES.find(pc => 
          normalizeString(pc.key) === normCat || normalizeString(pc.title) === normCat
        );
        const sub = parent?.subcategories.find(sc => 
          normalizeString(sc.key) === normSub || normalizeString(sc.name) === normSub
        );

        // Definir nomes/ordens canônicos
        const canonicalCategory = parent ? parent.title : items[0].category;
        const canonicalSub = sub ? sub.name : items[0].subcategory!;
        const canonicalCatOrder = parent ? parent.order : (items[0].categoryOrder ?? 999);
        const canonicalSubOrder = sub ? sub.order : (items[0].subcategoryOrder ?? 999);

        // Escolher vencedor (se já existir com nomes canônicos, usa ele; senão, primeiro)
        const winner = items.find(i => i.category === canonicalCategory && i.subcategory === canonicalSub) || items[0];
        const losers = items.filter(i => i.id !== winner.id);

        // Atualizar equipamentos que usam qualquer perdedor para os nomes canônicos
        for (const l of losers) {
          const { error: upErr, data: upData } = await supabase
            .from('equipments')
            .update({ category: canonicalCategory, subcategory: canonicalSub })
            .eq('category', l.category)
            .eq('subcategory', l.subcategory!)
            .select('id');
          if (upErr) {
            logger.error('Failed to migrate equipments on cleanup', { error: upErr, data: { from: { c: l.category, s: l.subcategory }, to: { c: canonicalCategory, s: canonicalSub } } });
          } else {
            updatedEquipments += upData?.length || 0;
          }
        }

        // Garantir que o vencedor tenha os nomes/ordens canônicos
        if (winner.category !== canonicalCategory || winner.subcategory !== canonicalSub || (winner.subcategoryOrder ?? 999) !== canonicalSubOrder || (winner.categoryOrder ?? 999) !== canonicalCatOrder) {
          const { error: winErr } = await supabase
            .from('equipment_categories')
            .update({
              category: canonicalCategory,
              subcategory: canonicalSub,
              category_order: canonicalCatOrder,
              subcategory_order: canonicalSubOrder,
              is_custom: false
            })
            .eq('id', winner.id);
          if (winErr) {
            logger.error('Failed to update winner on cleanup', { error: winErr, data: { id: winner.id } });
          }
        }

        // Marcar perdedores para exclusão
        losersToDelete.push(...losers.map(l => l.id));
      }

      // Excluir perdedores em lote
      let removed = 0;
      if (losersToDelete.length > 0) {
        const { error: delErr, data: delData } = await supabase
          .from('equipment_categories')
          .delete()
          .in('id', losersToDelete)
          .select('id');
        if (delErr) {
          logger.error('Failed to delete duplicate categories', { error: delErr, data: { ids: losersToDelete.length } });
        } else {
          removed = delData?.length || 0;
        }
      }

      await fetchCategories();
      logger.info('Clean duplicates - done', { module: 'categories', data: { removed, updatedEquipments } });
      return { success: true, data: { removed, updatedEquipments } };
    } catch (e) {
      logger.error('Clean duplicates - error', { error: e });
      return { success: false, error: 'Erro ao limpar duplicados' };
    }
  };
  return {
    categories,
    loading,
    getSubcategoriesForCategory,
    getCategoriesHierarchy,
    addCustomCategory,
    addCategoryOnly,
    addSubcategory,
    updateCategory,
    renameCategory,
    deleteCategory,
    deleteSubcategory,
    deleteCategoryWithSubcategories,
    getCategoryUsageCount,
    reorderSubcategory,
    syncOrdersWithMapping,
    refetch: fetchCategories,
    cleanDuplicateCategories
  };
}