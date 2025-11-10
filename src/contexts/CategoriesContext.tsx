import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { EquipmentCategoryData } from '@/types/equipment';

interface CategoriesContextType {
  categories: EquipmentCategoryData[];
  isLoading: boolean;
  getCategoryTitle: (key: string) => string;
  getSubcategoryTitle: (categoryKey: string, subcategoryKey: string) => string;
  getCategoryIcon: (key: string) => string | null;
  refresh: () => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextType | null>(null);

export const CategoriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<EquipmentCategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('equipment_categories')
      .select('*')
      .order('category_order', { ascending: true })
      .order('category', { ascending: true })
      .order('subcategory_order', { ascending: true })
      .order('subcategory', { ascending: true });

    if (!error && data) {
      // Map snake_case from DB to camelCase for TypeScript
      const mapped = data.map(item => ({
        id: item.id,
        category: item.category,
        subcategory: item.subcategory,
        isCustom: item.is_custom,
        createdAt: item.created_at,
        createdBy: item.created_by,
        categoryOrder: item.category_order,
        subcategoryOrder: item.subcategory_order,
        icon: item.icon
      }));
      setCategories(mapped);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const getCategoryTitle = (key: string): string => {
    if (!key) return '';
    const found = categories.find(c => c.category === key && !c.subcategory);
    return found?.category || key;
  };

  const getSubcategoryTitle = (categoryKey: string, subcategoryKey: string): string => {
    if (!subcategoryKey) return '';
    const found = categories.find(
      c => c.category === categoryKey && c.subcategory === subcategoryKey
    );
    return found?.subcategory || subcategoryKey;
  };

  const getCategoryIcon = (key: string): string | null => {
    const found = categories.find(c => c.category === key && !c.subcategory);
    return found?.icon || null;
  };

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        isLoading,
        getCategoryTitle,
        getSubcategoryTitle,
        getCategoryIcon,
        refresh: fetchCategories,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
};

export const useCategoriesContext = () => {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error('useCategoriesContext must be used within CategoriesProvider');
  }
  return context;
};
