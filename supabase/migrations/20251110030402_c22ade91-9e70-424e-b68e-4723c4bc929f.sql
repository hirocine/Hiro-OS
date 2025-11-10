-- FASE 1: Adicionar coluna icon e normalizar categorias para português

-- 1. Adicionar coluna para ícones
ALTER TABLE equipment_categories
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT NULL;

-- 2. Normalizar equipment_categories (Audio -> Áudio)
UPDATE equipment_categories
SET category = 'Áudio'
WHERE category = 'Audio';

-- 3. Normalizar equipments para português e consistência
UPDATE equipments
SET category = 'Áudio'
WHERE category IN ('audio', 'Audio', 'AUDIO');

UPDATE equipments
SET category = 'Câmera'
WHERE category IN ('camera', 'Camera', 'CAMERA');

UPDATE equipments
SET category = 'Iluminação'
WHERE category IN ('lighting', 'Lighting', 'LIGHTING', 'Iluminação');

UPDATE equipments
SET category = 'Monitoração e Transmissão'
WHERE category = 'Transmissão';

-- 4. Verificar integridade (log de categorias órfãs)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT DISTINCT e.category
    FROM equipments e
    LEFT JOIN equipment_categories ec ON e.category = ec.category
    WHERE ec.category IS NULL AND e.category IS NOT NULL
  ) LOOP
    RAISE NOTICE 'Categoria órfã encontrada em equipments: %', r.category;
  END LOOP;
END $$;