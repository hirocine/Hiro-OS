import { PARENT_CATEGORIES } from './categoryMapping';

/**
 * Retorna o título em português da categoria baseado na key
 */
export const getCategoryTitle = (categoryKey: string | undefined | null): string => {
  if (!categoryKey) return '';
  
  const parentCategory = PARENT_CATEGORIES.find(cat => cat.key === categoryKey);
  return parentCategory?.title || categoryKey;
};

/**
 * Retorna o título da subcategoria em português
 */
export const getSubcategoryTitle = (categoryKey: string | undefined | null, subcategoryKey: string | undefined | null): string => {
  if (!subcategoryKey) return '';
  
  const parentCategory = PARENT_CATEGORIES.find(cat => cat.key === categoryKey);
  const subcategory = parentCategory?.subcategories.find(sub => sub.key === subcategoryKey);
  
  return subcategory?.name || subcategoryKey;
};
