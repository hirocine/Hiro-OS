import { useMemo } from 'react';
import { PARENT_CATEGORIES, ParentCategoryConfig, findParentCategory, findSubcategory } from '@/lib/categoryMappingTemplate';
import { EquipmentCategoryData } from '@/types/equipment';

interface Equipment {
  id: string;
  name: string;
  category?: string;
  subcategory?: string | null;
  status: string;
  [key: string]: any;
}

interface GroupedSubcategory {
  key: string;
  name: string;
  order: number;
  equipment: Equipment[];
}

export interface GroupedCategory extends Omit<ParentCategoryConfig, 'subcategories'> {
  subcategories: GroupedSubcategory[];
}

/**
 * Hook que agrupa equipamentos por categoria mãe e subcategorias
 * 
 * @param equipment - Array de equipamentos do banco de dados
 * @param categoriesFromDB - Array de categorias do banco (opcional) - usado para obter ordens customizadas
 * @returns Array de categorias agrupadas com seus equipamentos organizados por subcategoria
 */
export const useGroupedCategories = (
  equipment: Equipment[], 
  categoriesFromDB?: EquipmentCategoryData[]
): GroupedCategory[] => {
  return useMemo(() => {
    if (!equipment || equipment.length === 0) {
      return [];
    }

    /**
     * Helper function to get order from database or fallback to mapping
     */
    const getOrderFromDB = (categoryKey: string, subcategoryKey: string): number => {
      if (!categoriesFromDB || categoriesFromDB.length === 0) {
        // Fallback to hardcoded order from mapping
        const parentCat = PARENT_CATEGORIES.find(pc => pc.key === categoryKey);
        if (!parentCat) return 999;
        
        const subcat = parentCat.subcategories.find(sc => sc.key === subcategoryKey);
        return subcat?.order ?? 999;
      }

      // Try to find order in database
      const dbEntry = categoriesFromDB.find(
        cat => cat.category === categoryKey && cat.subcategory === subcategoryKey
      );
      
      if (dbEntry && dbEntry.subcategoryOrder !== null && dbEntry.subcategoryOrder !== undefined) {
        return dbEntry.subcategoryOrder;
      }

      // Fallback to mapping if not found in DB
      const parentCat = PARENT_CATEGORIES.find(pc => pc.key === categoryKey);
      if (!parentCat) return 999;
      
      const subcat = parentCat.subcategories.find(sc => sc.key === subcategoryKey);
      return subcat?.order ?? 999;
    };

    const grouped: GroupedCategory[] = [];

    // Processar cada categoria mãe
    PARENT_CATEGORIES.forEach(parentCat => {
      const groupedCategory: GroupedCategory = {
        key: parentCat.key,
        title: parentCat.title,
        icon: parentCat.icon,
        order: parentCat.order,
        subcategories: []
      };

      // Inicializar todas as subcategorias (mesmo vazias)
      parentCat.subcategories.forEach(subCatConfig => {
        const orderFromDB = getOrderFromDB(parentCat.key, subCatConfig.key);
        
        groupedCategory.subcategories.push({
          key: subCatConfig.key,
          name: subCatConfig.name,
          order: orderFromDB,
          equipment: []
        });
      });

      // Filtrar equipamentos que pertencem a esta categoria mãe
      const categoryEquipment = equipment.filter(eq => {
        const foundParent = findParentCategory(eq.category);
        return foundParent?.key === parentCat.key;
      });

      // Distribuir equipamentos nas subcategorias corretas
      categoryEquipment.forEach(eq => {
        // Se o equipamento tem subcategoria definida, tentar encontrá-la
        if (eq.subcategory) {
          const foundSubcategory = findSubcategory(parentCat, eq.subcategory);
          
          if (foundSubcategory) {
            const subcatIndex = groupedCategory.subcategories.findIndex(
              sub => sub.key === foundSubcategory.key
            );
            
            if (subcatIndex !== -1) {
              groupedCategory.subcategories[subcatIndex].equipment.push(eq);
            }
          } else {
            // Subcategoria customizada não mapeada - criar dinamicamente
            const normalizedSubKey = eq.subcategory.toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/\s+/g, '-')
              .trim();
            
            let customSubcat = groupedCategory.subcategories.find(
              sub => sub.key === normalizedSubKey
            );
            
            if (!customSubcat) {
              // Criar nova subcategoria custom
              customSubcat = {
                key: normalizedSubKey,
                name: eq.subcategory, // Nome original do banco
                order: 998, // Quase no fim
                equipment: []
              };
              groupedCategory.subcategories.push(customSubcat);
            }
            
            customSubcat.equipment.push(eq);
          }
        } else {
          // Se não tem subcategoria, adicionar na subcategoria padrão (order: 0) ou "outros"
          const defaultSubcat = groupedCategory.subcategories.find(sub => sub.order === 0);
          const othersSubcat = groupedCategory.subcategories.find(
            sub => sub.key === 'outros' || sub.key === 'acessório'
          );
          
          if (defaultSubcat) {
            defaultSubcat.equipment.push(eq);
          } else if (othersSubcat) {
            othersSubcat.equipment.push(eq);
          } else if (groupedCategory.subcategories.length > 0) {
            groupedCategory.subcategories[0].equipment.push(eq);
          }
        }
      });

      // Ordenar subcategorias
      groupedCategory.subcategories.sort((a, b) => a.order - b.order);

      // Só adicionar categoria mãe se tiver pelo menos um equipamento
      const hasEquipment = groupedCategory.subcategories.some(
        sub => sub.equipment.length > 0
      );
      
      if (hasEquipment) {
        grouped.push(groupedCategory);
      }
    });

    // Ordenar categorias mães
    return grouped.sort((a, b) => a.order - b.order);
  }, [equipment, categoriesFromDB]);
};

/**
 * Hook auxiliar que retorna estatísticas sobre as categorias agrupadas
 */
export const useGroupedCategoriesStats = (groupedCategories: GroupedCategory[]) => {
  return useMemo(() => {
    const stats = {
      totalCategories: groupedCategories.length,
      totalSubcategories: 0,
      totalEquipment: 0,
      categoriesWithEquipment: 0,
      subcategoriesWithEquipment: 0
    };

    groupedCategories.forEach(cat => {
      const subcatsWithEquipment = cat.subcategories.filter(
        sub => sub.equipment.length > 0
      );
      
      stats.totalSubcategories += cat.subcategories.length;
      stats.subcategoriesWithEquipment += subcatsWithEquipment.length;
      
      const catEquipmentCount = cat.subcategories.reduce(
        (sum, sub) => sum + sub.equipment.length, 
        0
      );
      
      stats.totalEquipment += catEquipmentCount;
      
      if (catEquipmentCount > 0) {
        stats.categoriesWithEquipment++;
      }
    });

    return stats;
  }, [groupedCategories]);
};
