import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EquipmentCategoryData, CategoryHierarchy } from '@/types/equipment';
import { logger } from '@/lib/logger';
import { handleLegacyError, DatabaseError, wrapAsync } from '@/lib/errors';
import type { Result } from '@/types/common';
import type { EquipmentCategoryDbRow } from '@/types/database';

export function useCategories() {
  const [categories, setCategories] = useState<EquipmentCategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    logger.apiCall('GET', '/equipment_categories');
    
    const result = await wrapAsync(async () => {
      const { data, error } = await supabase
        .from('equipment_categories')
        .select('*')
        .order('category', { ascending: true })
        .order('subcategory', { ascending: true });

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
        createdBy: item.created_by
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
        is_custom: true
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
        createdBy: data.created_by
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
          usageCount: 0
        });
      } else {
        acc[cat.category].categoryId = cat.id;
        acc[cat.category].isCustom = cat.isCustom;
      }
      
      return acc;
    }, {} as Record<string, CategoryHierarchy>);
    
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
        .eq('category', oldCategoryName)
        .eq('is_custom', true);
      
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
        .eq('category', categoryName)
        .eq('is_custom', true);
      
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
        .eq('is_custom', true) // Only allow updating custom categories
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
        createdBy: data.created_by
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
        .eq('id', categoryId)
        .eq('is_custom', true); // Only allow deleting custom categories

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
    refetch: fetchCategories
  };
}