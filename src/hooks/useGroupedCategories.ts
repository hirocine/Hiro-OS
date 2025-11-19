import { useMemo } from 'react';
import { getCategoryIcon } from '@/lib/categoryIconMap';
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

export interface GroupedCategory {
  key: string;
  title: string;
  icon: any;
  order: number;
  subcategories: GroupedSubcategory[];
}

/**
 * Hook que agrupa equipamentos por categoria mãe e subcategorias
 * Usa o banco de dados como única fonte de verdade para categorias e ordenação
 * 
 * @param equipment - Array de equipamentos do banco de dados
 * @param categoriesFromDB - Array de categorias do banco (obrigatório)
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

    if (!categoriesFromDB || categoriesFromDB.length === 0) {
      return [];
    }

    // Agrupar dados do banco por categoria principal
    const categoryMap = new Map<string, EquipmentCategoryData[]>();
    
    categoriesFromDB.forEach(cat => {
      if (!categoryMap.has(cat.category)) {
        categoryMap.set(cat.category, []);
      }
      categoryMap.get(cat.category)!.push(cat);
    });

    // Construir estrutura final
    const grouped: GroupedCategory[] = [];

    categoryMap.forEach((subcats, categoryName) => {
      // Pegar order da categoria (usar o menor order encontrado)
      const categoryOrder = Math.min(
        ...subcats.map(s => s.categoryOrder ?? 999)
      );

      // Filtrar equipamentos desta categoria
      const categoryEquipment = equipment.filter(
        eq => eq.category === categoryName
      );

      if (categoryEquipment.length === 0) {
        return; // Pular categorias sem equipamentos
      }

      // Criar subcategorias com equipamentos
      const subcategoriesWithEquipment: GroupedSubcategory[] = [];

      subcats
        .filter(s => s.subcategory !== null)
        .sort((a, b) => 
          (a.subcategoryOrder ?? 999) - (b.subcategoryOrder ?? 999) ||
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        )
        .forEach(subcat => {
          const subcatEquipment = categoryEquipment.filter(
            eq => eq.subcategory === subcat.subcategory
          );

          if (subcatEquipment.length > 0) {
            subcategoriesWithEquipment.push({
              key: subcat.subcategory!.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '-')
                .trim(),
              name: subcat.subcategory!,
              order: subcat.subcategoryOrder ?? 999,
              equipment: subcatEquipment
            });
          }
        });

      // Adicionar categoria ao resultado
      if (subcategoriesWithEquipment.length > 0) {
        grouped.push({
          key: categoryName.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-')
            .trim(),
          title: categoryName,
          icon: getCategoryIcon(categoryName),
          order: categoryOrder,
          subcategories: subcategoriesWithEquipment
        });
      }
    });

    // Ordenar categorias por order
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
