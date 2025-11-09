-- Atualizar todas as categorias existentes para is_custom = false
UPDATE equipment_categories 
SET is_custom = false 
WHERE is_custom = true;