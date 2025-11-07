-- Add order fields to equipment_categories table
ALTER TABLE equipment_categories 
ADD COLUMN category_order INTEGER DEFAULT 999,
ADD COLUMN subcategory_order INTEGER DEFAULT 999;

-- Create index for better query performance
CREATE INDEX idx_equipment_categories_order 
ON equipment_categories(category_order, subcategory_order);

-- Populate order values based on the specified hierarchy

-- CÂMERA (1)
UPDATE equipment_categories SET category_order = 1, subcategory_order = 1 WHERE category = 'Câmera' AND subcategory = 'Câmera';
UPDATE equipment_categories SET category_order = 1, subcategory_order = 2 WHERE category = 'Câmera' AND subcategory = 'Lente';
UPDATE equipment_categories SET category_order = 1, subcategory_order = 3 WHERE category = 'Câmera' AND subcategory = 'Cage';
UPDATE equipment_categories SET category_order = 1, subcategory_order = 4 WHERE category = 'Câmera' AND subcategory = 'Filtro';
UPDATE equipment_categories SET category_order = 1, subcategory_order = 5 WHERE category = 'Câmera' AND subcategory = 'Acessórios';
UPDATE equipment_categories SET category_order = 1, subcategory_order = 6 WHERE category = 'Câmera' AND subcategory = 'Bateria';
UPDATE equipment_categories SET category_order = 1, subcategory_order = 7 WHERE category = 'Câmera' AND subcategory = 'Carregador';
UPDATE equipment_categories SET category_order = 1, subcategory_order = 8 WHERE category = 'Câmera' AND subcategory = 'Cabo';
UPDATE equipment_categories SET category_order = 1, subcategory_order = 9 WHERE category = 'Câmera' AND subcategory = 'Case';

-- MONITORAÇÃO (2)
UPDATE equipment_categories SET category_order = 2, subcategory_order = 1 WHERE category = 'Monitoração' AND subcategory = 'Monitor';
UPDATE equipment_categories SET category_order = 2, subcategory_order = 2 WHERE category = 'Monitoração' AND subcategory = 'Transmissão';

-- TRIPÉS E MOVIMENTO (3)
UPDATE equipment_categories SET category_order = 3, subcategory_order = 1 WHERE category = 'Tripés e Movimento' AND subcategory = 'Tripé';
UPDATE equipment_categories SET category_order = 3, subcategory_order = 2 WHERE category = 'Tripés e Movimento' AND subcategory = 'Estabilizador';

-- ÁUDIO (4)
UPDATE equipment_categories SET category_order = 4, subcategory_order = 1 WHERE category = 'Áudio' AND subcategory = 'Microfone';
UPDATE equipment_categories SET category_order = 4, subcategory_order = 2 WHERE category = 'Áudio' AND subcategory = 'Gravador';
UPDATE equipment_categories SET category_order = 4, subcategory_order = 3 WHERE category = 'Áudio' AND subcategory = 'Braço Articulado';
UPDATE equipment_categories SET category_order = 4, subcategory_order = 4 WHERE category = 'Áudio' AND subcategory = 'Cabo';

-- ACESSÓRIOS (5)
UPDATE equipment_categories SET category_order = 5, subcategory_order = 1 WHERE category = 'Acessórios' AND subcategory = 'Mochila';
UPDATE equipment_categories SET category_order = 5, subcategory_order = 2 WHERE category = 'Acessórios' AND subcategory = 'Case';
UPDATE equipment_categories SET category_order = 5, subcategory_order = 3 WHERE category = 'Acessórios' AND subcategory = 'Filtro';
UPDATE equipment_categories SET category_order = 5, subcategory_order = 4 WHERE category = 'Acessórios' AND subcategory = 'Cabo';
UPDATE equipment_categories SET category_order = 5, subcategory_order = 5 WHERE category = 'Acessórios' AND subcategory = 'Bateria';

-- ILUMINAÇÃO (6)
UPDATE equipment_categories SET category_order = 6, subcategory_order = 1 WHERE category = 'Iluminação' AND subcategory = 'Luz';
UPDATE equipment_categories SET category_order = 6, subcategory_order = 2 WHERE category = 'Iluminação' AND subcategory = 'Modificador de Luz';

-- MAQUINÁRIA (7)
UPDATE equipment_categories SET category_order = 7, subcategory_order = 1 WHERE category = 'Maquinária' AND subcategory = 'Tripé de Câmera';

-- ELÉTRICA (8)
UPDATE equipment_categories SET category_order = 8, subcategory_order = 1 WHERE category = 'Elétrica' AND subcategory = 'Caçapa';

-- ARMAZENAMENTO (9)
UPDATE equipment_categories SET category_order = 9, subcategory_order = 1 WHERE category = 'Armazenamento' AND subcategory = 'SSD/HD Externo';
UPDATE equipment_categories SET category_order = 9, subcategory_order = 2 WHERE category = 'Armazenamento' AND subcategory = 'SSD/HD Interno';
UPDATE equipment_categories SET category_order = 9, subcategory_order = 3 WHERE category = 'Armazenamento' AND subcategory = 'Cartão de Memória';
UPDATE equipment_categories SET category_order = 9, subcategory_order = 4 WHERE category = 'Armazenamento' AND subcategory = 'Leitor de Cartão';

-- TECNOLOGIA (10)
UPDATE equipment_categories SET category_order = 10, subcategory_order = 1 WHERE category = 'Tecnologia' AND subcategory = 'Notebook';
UPDATE equipment_categories SET category_order = 10, subcategory_order = 2 WHERE category = 'Tecnologia' AND subcategory = 'Desktop';
UPDATE equipment_categories SET category_order = 10, subcategory_order = 3 WHERE category = 'Tecnologia' AND subcategory = 'Monitor';
UPDATE equipment_categories SET category_order = 10, subcategory_order = 4 WHERE category = 'Tecnologia' AND subcategory = 'Webcam';
UPDATE equipment_categories SET category_order = 10, subcategory_order = 5 WHERE category = 'Tecnologia' AND subcategory = 'Mouse';
UPDATE equipment_categories SET category_order = 10, subcategory_order = 6 WHERE category = 'Tecnologia' AND subcategory = 'Teclado';
UPDATE equipment_categories SET category_order = 10, subcategory_order = 7 WHERE category = 'Tecnologia' AND subcategory = 'Cabo';
UPDATE equipment_categories SET category_order = 10, subcategory_order = 8 WHERE category = 'Tecnologia' AND subcategory = 'Carregador';
UPDATE equipment_categories SET category_order = 10, subcategory_order = 9 WHERE category = 'Tecnologia' AND subcategory = 'Caixa de Som';

-- CONSUMÍVEIS (11)
UPDATE equipment_categories SET category_order = 11, subcategory_order = 1 WHERE category = 'Consumíveis' AND subcategory = 'Fita Gaffer';
UPDATE equipment_categories SET category_order = 11, subcategory_order = 2 WHERE category = 'Consumíveis' AND subcategory = 'Fita Crepe';
UPDATE equipment_categories SET category_order = 11, subcategory_order = 3 WHERE category = 'Consumíveis' AND subcategory = 'Abraçadeiras';
UPDATE equipment_categories SET category_order = 11, subcategory_order = 4 WHERE category = 'Consumíveis' AND subcategory = 'Pano Preto';

-- TRANSMISSÃO (12)
UPDATE equipment_categories SET category_order = 12, subcategory_order = 1 WHERE category = 'Transmissão' AND subcategory = 'Mesa de Corte';
UPDATE equipment_categories SET category_order = 12, subcategory_order = 2 WHERE category = 'Transmissão' AND subcategory = 'Placa de Captura';
UPDATE equipment_categories SET category_order = 12, subcategory_order = 3 WHERE category = 'Transmissão' AND subcategory = 'Conversores';