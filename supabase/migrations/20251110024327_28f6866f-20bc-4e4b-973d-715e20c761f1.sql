-- Padronizar todas as categorias em português no banco de dados
-- Migração para converter categorias de inglês para as keys do categoryMapping.ts

-- Atualizar equipamentos com categorias antigas em inglês
UPDATE equipments 
SET category = 'camera' 
WHERE category IN ('câmera', 'câmeras', 'cameras');

UPDATE equipments 
SET category = 'monitoring' 
WHERE category IN ('monitoração', 'monitoracao', 'monitor');

UPDATE equipments 
SET category = 'audio' 
WHERE category IN ('áudio', 'som');

UPDATE equipments 
SET category = 'lighting' 
WHERE category IN ('iluminação', 'iluminacao', 'luz');

UPDATE equipments 
SET category = 'grip' 
WHERE category IN ('apoio');

UPDATE equipments 
SET category = 'electrical' 
WHERE category IN ('elétrica', 'eletrica');

UPDATE equipments 
SET category = 'storage' 
WHERE category IN ('armazenamento');

UPDATE equipments 
SET category = 'computers' 
WHERE category IN ('computadores', 'computador');

UPDATE equipments 
SET category = 'miscellaneous' 
WHERE category IN ('diversos', 'acessórios', 'acessorios', 'accessories');

-- Atualizar tabela de categorias também
UPDATE equipment_categories 
SET category = 'camera' 
WHERE category IN ('câmera', 'câmeras', 'cameras');

UPDATE equipment_categories 
SET category = 'monitoring' 
WHERE category IN ('monitoração', 'monitoracao', 'monitor');

UPDATE equipment_categories 
SET category = 'audio' 
WHERE category IN ('áudio', 'som');

UPDATE equipment_categories 
SET category = 'lighting' 
WHERE category IN ('iluminação', 'iluminacao', 'luz');

UPDATE equipment_categories 
SET category = 'grip' 
WHERE category IN ('apoio');

UPDATE equipment_categories 
SET category = 'electrical' 
WHERE category IN ('elétrica', 'eletrica');

UPDATE equipment_categories 
SET category = 'storage' 
WHERE category IN ('armazenamento');

UPDATE equipment_categories 
SET category = 'computers' 
WHERE category IN ('computadores', 'computador');

UPDATE equipment_categories 
SET category = 'miscellaneous' 
WHERE category IN ('diversos', 'acessórios', 'acessorios', 'accessories');