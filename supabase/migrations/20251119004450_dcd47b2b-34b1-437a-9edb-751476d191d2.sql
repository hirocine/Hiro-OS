-- Passo 1: Atribuir category_order baseado em created_at (10, 20, 30...)
WITH ranked_categories AS (
  SELECT 
    DISTINCT category,
    ROW_NUMBER() OVER (ORDER BY MIN(created_at)) * 10 as new_order
  FROM equipment_categories
  GROUP BY category
)
UPDATE equipment_categories ec
SET category_order = rc.new_order
FROM ranked_categories rc
WHERE ec.category = rc.category;

-- Passo 2: Atribuir subcategory_order baseado em created_at dentro de cada categoria (10, 20, 30...)
WITH ranked_subcategories AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY category 
      ORDER BY created_at
    ) * 10 as new_order
  FROM equipment_categories
  WHERE subcategory IS NOT NULL
)
UPDATE equipment_categories ec
SET subcategory_order = rs.new_order
FROM ranked_subcategories rs
WHERE ec.id = rs.id;