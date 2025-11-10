/**
 * ⚠️ DEPRECATED: Este arquivo foi substituído pelo CategoriesContext
 * 
 * Use o hook useCategoriesContext() para acessar:
 * - getCategoryTitle(key)
 * - getSubcategoryTitle(categoryKey, subcategoryKey)
 * - getCategoryIcon(key)
 * 
 * Todas as categorias são gerenciadas via banco de dados no Admin Panel.
 */

/**
 * @deprecated Use useCategoriesContext().getCategoryTitle() instead
 */
export const getCategoryTitle = (categoryKey: string | undefined | null): string => {
  if (!categoryKey) return '';
  return categoryKey;
};

/**
 * @deprecated Use useCategoriesContext().getSubcategoryTitle() instead
 */
export const getSubcategoryTitle = (categoryKey: string | undefined | null, subcategoryKey: string | undefined | null): string => {
  if (!subcategoryKey) return '';
  return subcategoryKey;
};
