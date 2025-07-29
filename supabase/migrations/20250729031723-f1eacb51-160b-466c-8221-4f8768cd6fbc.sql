-- Add subcategories for camera category
INSERT INTO equipment_categories (category, subcategory, is_custom) VALUES 
('camera', 'Câmera', false),
('camera', 'Acessórios', false)
ON CONFLICT (category, subcategory) DO NOTHING;