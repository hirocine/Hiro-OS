-- Permitir subcategory NULL para categorias sem subcategorias
ALTER TABLE equipment_categories 
ALTER COLUMN subcategory DROP NOT NULL;

-- Adicionar índice para melhor performance em buscas hierárquicas
CREATE INDEX IF NOT EXISTS idx_equipment_categories_category ON equipment_categories(category);
CREATE INDEX IF NOT EXISTS idx_equipment_categories_hierarchy ON equipment_categories(category, subcategory) WHERE subcategory IS NOT NULL;