import { useMemo } from 'react';
import { PARENT_CATEGORIES, ParentCategoryConfig, findParentCategory, findSubcategory } from '@/lib/categoryMapping';

interface Equipment {
  id: string;
  name: string;
  category: string;
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
 * @returns Array de categorias agrupadas com seus equipamentos organizados por subcategoria
 */
export const useGroupedCategories = (equipment: Equipment[]): GroupedCategory[] => {
  return useMemo(() => {
    if (!equipment || equipment.length === 0) {
      return [];
    }

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
        groupedCategory.subcategories.push({
          key: subCatConfig.key,
          name: subCatConfig.name,
          order: subCatConfig.order,
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
            // Se não encontrou subcategoria correspondente, adicionar em "Outros" ou primeira disponível
            const othersIndex = groupedCategory.subcategories.findIndex(
              sub => sub.key === 'outros' || sub.key === 'acessório'
            );
            
            if (othersIndex !== -1) {
              groupedCategory.subcategories[othersIndex].equipment.push(eq);
            } else if (groupedCategory.subcategories.length > 0) {
              groupedCategory.subcategories[0].equipment.push(eq);
            }
          }
        } else {
          // Se não tem subcategoria, adicionar na primeira subcategoria disponível
          if (groupedCategory.subcategories.length > 0) {
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
  }, [equipment]);
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
