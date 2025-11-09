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
      // Verificar se corresponde a uma categoria canônica
      const { PARENT_CATEGORIES } = await import('@/lib/categoryMapping');
      let finalCategory = category;
      let finalSubcategory = subcategory;
      let isCustom = true;
      let categoryOrder = 999;
      let subcategoryOrder = 999;

      // Buscar match com categoria pai
      const parentMatch = PARENT_CATEGORIES.find(p => 
        normalizeString(p.key) === normalizeString(category) ||
        normalizeString(p.title) === normalizeString(category)
      );

      if (parentMatch) {
        finalCategory = parentMatch.title;
        categoryOrder = parentMatch.order;
        
        // Se tem subcategoria, buscar match
        if (subcategory) {
          const subMatch = parentMatch.subcategories.find(s =>
            normalizeString(s.key) === normalizeString(subcategory) ||
            normalizeString(s.name) === normalizeString(subcategory)
          );
          
          if (subMatch) {
            finalSubcategory = subMatch.name;
            subcategoryOrder = subMatch.order;
            isCustom = false;
          }
        } else {
          isCustom = false;
        }
      }

      const categoryData = {
        category: finalCategory,
        subcategory: finalSubcategory,
        is_custom: isCustom,
        category_order: categoryOrder,
        subcategory_order: subcategoryOrder
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
    // Agrupar por chave normalizada para evitar duplicatas visuais
    const grouped = categories.reduce((acc, cat) => {
      const normalizedKey = normalizeString(cat.category);
      
      if (!acc[normalizedKey]) {
        acc[normalizedKey] = {
          categoryName: cat.category,
          categoryId: null,
          isCustom: cat.isCustom,
          subcategories: []
        };
      }
      
      if (cat.subcategory) {
        // Evitar duplicar subcategorias
        const subNormKey = normalizeString(cat.subcategory);
        const existingSub = acc[normalizedKey].subcategories.find(s => 
          normalizeString(s.name) === subNormKey
        );
        
        if (!existingSub) {
          acc[normalizedKey].subcategories.push({
            id: cat.id,
            name: cat.subcategory,
            isCustom: cat.isCustom,
            usageCount: 0,
            order: cat.subcategoryOrder || 999
          });
        }
      } else {
        acc[normalizedKey].categoryId = cat.id;
        acc[normalizedKey].isCustom = cat.isCustom;
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
      // Verificar se o novo nome corresponde a uma categoria canônica
      const { PARENT_CATEGORIES } = await import('@/lib/categoryMapping');
      let finalNewName = newCategoryName;
      
      const parentMatch = PARENT_CATEGORIES.find(p => 
        normalizeString(p.key) === normalizeString(newCategoryName) ||
        normalizeString(p.title) === normalizeString(newCategoryName)
      );

      if (parentMatch) {
        finalNewName = parentMatch.title;
      }

      const { error } = await supabase
        .from('equipment_categories')
        .update({ category: finalNewName })
        .eq('category', oldCategoryName);
      
      if (error) {
        logger.database('update', 'equipment_categories', false, error);
        throw new DatabaseError(`Failed to rename category: ${error.message}`, 'update', 'equipment_categories');
      }

      await supabase
        .from('equipments')
        .update({ category: finalNewName })
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

  /**
   * Limpa e normaliza categorias em duas fases:
   * Fase A - Normalização: atualiza todos os registros para nomes canônicos
   * Fase B - Deduplicação: remove entradas duplicadas e migra equipamentos
   */
  const cleanDuplicateCategories = async (): Promise<Result<{ removed: number; updatedEquipments: number; updatedCategories: number }>> => {
    try {
      logger.info('Clean & Normalize - start', { module: 'categories' });

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

      // Carregar mapping
      const { PARENT_CATEGORIES } = await import('@/lib/categoryMapping');

      // === FASE A: NORMALIZAÇÃO ===
      logger.info('Phase A - Normalization', { module: 'categories' });
      let updatedCategories = 0;

      for (const row of rows) {
        const parentMatch = PARENT_CATEGORIES.find(p => 
          normalizeString(p.key) === normalizeString(row.category) ||
          normalizeString(p.title) === normalizeString(row.category)
        );

        if (parentMatch) {
          let needsUpdate = false;
          const updates: any = {};

          // Normalizar nome da categoria
          if (row.category !== parentMatch.title) {
            updates.category = parentMatch.title;
            needsUpdate = true;
          }

          // Normalizar ordem da categoria
          if ((row.categoryOrder ?? 999) !== parentMatch.order) {
            updates.category_order = parentMatch.order;
            needsUpdate = true;
          }

          // Se tem subcategoria, normalizar também
          if (row.subcategory) {
            const subMatch = parentMatch.subcategories.find(s =>
              normalizeString(s.key) === normalizeString(row.subcategory!) ||
              normalizeString(s.name) === normalizeString(row.subcategory!)
            );

            if (subMatch) {
              if (row.subcategory !== subMatch.name) {
                updates.subcategory = subMatch.name;
                needsUpdate = true;
              }
              if ((row.subcategoryOrder ?? 999) !== subMatch.order) {
                updates.subcategory_order = subMatch.order;
                needsUpdate = true;
              }
              if (row.isCustom) {
                updates.is_custom = false;
                needsUpdate = true;
              }
            }
          } else {
            // Categoria sem subcategoria - marcar como não custom se bater com mapping
            if (row.isCustom) {
              updates.is_custom = false;
              needsUpdate = true;
            }
          }

          // Aplicar atualizações se necessário
          if (needsUpdate) {
            const { error: updateErr } = await supabase
              .from('equipment_categories')
              .update(updates)
              .eq('id', row.id);

            if (updateErr) {
              logger.error('Failed to normalize category', { error: updateErr, data: { id: row.id, updates } });
            } else {
              updatedCategories += 1;
              logger.debug('Normalized category', { module: 'categories', data: { id: row.id, from: row.category, to: updates.category || row.category } });
            }
          }
        }
      }

      logger.info('Phase A - Done', { module: 'categories', data: { updatedCategories } });

      // === FASE B: DEDUPLICAÇÃO ===
      logger.info('Phase B - Deduplication', { module: 'categories' });
      
      // Re-buscar dados após normalização
      const { data: freshData, error: freshError } = await supabase
        .from('equipment_categories')
        .select('*');
      
      if (freshError) {
        logger.error('Failed to re-fetch categories', { error: freshError });
        return { success: false, error: 'Falha ao re-buscar categorias' };
      }

      const freshRows = (freshData as EquipmentCategoryDbRow[]).map(item => ({
        id: item.id,
        category: item.category,
        subcategory: item.subcategory,
        isCustom: item.is_custom,
        createdAt: item.created_at,
        createdBy: item.created_by,
        categoryOrder: item.category_order,
        subcategoryOrder: item.subcategory_order
      })) as EquipmentCategoryData[];

      // Agrupar por categoria/subcategoria normalizada
      const groups = new Map<string, EquipmentCategoryData[]>();
      for (const r of freshRows) {
        const key = r.subcategory 
          ? `${normalizeString(r.category)}::${normalizeString(r.subcategory)}`
          : `${normalizeString(r.category)}::∅`;
        const arr = groups.get(key) || [];
        arr.push(r);
        groups.set(key, arr);
      }

      const losersToDelete: string[] = [];
      let updatedEquipments = 0;

      // Processar cada grupo com duplicados
      for (const [key, items] of groups) {
        if (items.length <= 1) continue; // não há duplicados

        // Escolher vencedor (preferir o que não é custom, depois o mais antigo)
        const winner = items.find(i => !i.isCustom) || items.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )[0];
        const losers = items.filter(i => i.id !== winner.id);

        logger.debug('Duplicate group found', { 
          module: 'categories', 
          data: { key, total: items.length, winner: winner.id, losers: losers.length } 
        });

        // Migrar equipamentos dos perdedores para o vencedor
        for (const loser of losers) {
          const { error: upErr, data: upData } = await supabase
            .from('equipments')
            .update({ 
              category: winner.category, 
              subcategory: winner.subcategory 
            })
            .eq('category', loser.category)
            .eq('subcategory', loser.subcategory)
            .select('id');

          if (upErr) {
            logger.error('Failed to migrate equipments', { 
              error: upErr, 
              data: { from: { c: loser.category, s: loser.subcategory }, to: { c: winner.category, s: winner.subcategory } } 
            });
          } else {
            const migratedCount = upData?.length || 0;
            updatedEquipments += migratedCount;
            if (migratedCount > 0) {
              logger.debug('Migrated equipments', { module: 'categories', data: { count: migratedCount } });
            }
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
          logger.info('Deleted duplicates', { module: 'categories', data: { removed } });
        }
      }

      logger.info('Phase B - Done', { module: 'categories', data: { removed, updatedEquipments } });

      // Refetch após limpeza
      await fetchCategories();
      
      logger.info('Clean & Normalize - complete', { 
        module: 'categories', 
        data: { updatedCategories, removed, updatedEquipments } 
      });

      return { 
        success: true, 
        data: { removed, updatedEquipments, updatedCategories } 
      };
    } catch (e) {
      logger.error('Clean & Normalize - error', { error: e });
      return { success: false, error: 'Erro ao limpar e normalizar categorias' };
    }
  };

  /**
   * Reset completo: deleta TODAS as categorias e insere apenas as canônicas
   */
  const resetCategoriesToDefault = async (): Promise<Result<{ inserted: number }>> => {
    try {
      logger.info('Reset to default - start', { module: 'categories' });

      // Fase 1: Deletar TODAS as categorias existentes
      const { error: deleteError } = await supabase
        .from('equipment_categories')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (deleteError) {
        logger.error('Failed to delete all categories', { error: deleteError });
        throw new DatabaseError('Erro ao deletar categorias', 'delete', 'equipment_categories');
      }

      logger.info('All categories deleted', { module: 'categories' });

      // Fase 2: Inserir categorias canônicas do PARENT_CATEGORIES
      const { PARENT_CATEGORIES } = await import('@/lib/categoryMapping');
      const insertData = [];
      
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      for (const parent of PARENT_CATEGORIES) {
        for (const sub of parent.subcategories) {
          insertData.push({
            category: parent.title,
            subcategory: sub.name,
            category_order: parent.order,
            subcategory_order: sub.order,
            is_custom: false,
            created_by: userId
          });
        }
      }
      
      const { error: insertError } = await supabase
        .from('equipment_categories')
        .insert(insertData);
      
      if (insertError) {
        logger.error('Failed to insert canonical categories', { error: insertError });
        throw new DatabaseError('Erro ao inserir categorias canônicas', 'insert', 'equipment_categories');
      }

      logger.info('Canonical categories inserted', { 
        module: 'categories', 
        data: { inserted: insertData.length } 
      });

      await fetchCategories();
      
      return { 
        success: true, 
        data: { inserted: insertData.length } 
      };
    } catch (e) {
      logger.error('Reset to default - error', { error: e });
      return { success: false, error: 'Erro ao resetar categorias' };
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
    cleanDuplicateCategories,
    resetCategoriesToDefault
  };
}