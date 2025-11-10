-- Limpeza definitiva de whitespace em categorias e subcategorias
-- Camada 1: Database - cleanup + constraints

-- Limpar whitespace invisível de equipments
UPDATE equipments 
SET 
  category = TRIM(BOTH E'\n\r\t ' FROM category),
  subcategory = TRIM(BOTH E'\n\r\t ' FROM subcategory)
WHERE 
  category != TRIM(BOTH E'\n\r\t ' FROM category)
  OR (subcategory IS NOT NULL AND subcategory != TRIM(BOTH E'\n\r\t ' FROM subcategory));

-- Limpar whitespace invisível de equipment_categories
UPDATE equipment_categories
SET 
  category = TRIM(BOTH E'\n\r\t ' FROM category),
  subcategory = TRIM(BOTH E'\n\r\t ' FROM subcategory)
WHERE 
  category != TRIM(BOTH E'\n\r\t ' FROM category)
  OR (subcategory IS NOT NULL AND subcategory != TRIM(BOTH E'\n\r\t ' FROM subcategory));

-- Adicionar constraints para prevenir whitespace no futuro
ALTER TABLE equipments
DROP CONSTRAINT IF EXISTS equipments_category_no_whitespace,
ADD CONSTRAINT equipments_category_no_whitespace 
  CHECK (category = TRIM(BOTH E'\n\r\t ' FROM category));

ALTER TABLE equipments
DROP CONSTRAINT IF EXISTS equipments_subcategory_no_whitespace,
ADD CONSTRAINT equipments_subcategory_no_whitespace 
  CHECK (subcategory IS NULL OR subcategory = TRIM(BOTH E'\n\r\t ' FROM subcategory));

ALTER TABLE equipment_categories
DROP CONSTRAINT IF EXISTS equipment_categories_category_no_whitespace,
ADD CONSTRAINT equipment_categories_category_no_whitespace 
  CHECK (category = TRIM(BOTH E'\n\r\t ' FROM category));

ALTER TABLE equipment_categories
DROP CONSTRAINT IF EXISTS equipment_categories_subcategory_no_whitespace,
ADD CONSTRAINT equipment_categories_subcategory_no_whitespace 
  CHECK (subcategory IS NULL OR subcategory = TRIM(BOTH E'\n\r\t ' FROM subcategory));