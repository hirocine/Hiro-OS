import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EquipmentCategoryData } from '@/types/equipment';
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

  const addCustomCategory = async (category: string, subcategory: string): Promise<Result<EquipmentCategoryData>> => {
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

  const getSubcategoriesForCategory = (categoryKey: string) => {
    return categories
      .filter(cat => cat.category === categoryKey)
      .map(cat => cat.subcategory);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    getSubcategoriesForCategory,
    addCustomCategory,
    refetch: fetchCategories
  };
}