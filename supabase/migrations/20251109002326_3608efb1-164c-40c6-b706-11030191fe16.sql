-- Migrar categorias de inglês para português para consistência
-- Esta é uma operação de dados para alinhar equipamentos antigos com o novo sistema

UPDATE equipments SET category = 'Câmera' WHERE category = 'camera';
UPDATE equipments SET category = 'Audio' WHERE category = 'audio';
UPDATE equipments SET category = 'Iluminação' WHERE category = 'lighting';
UPDATE equipments SET category = 'Acessórios' WHERE category = 'accessories';
UPDATE equipments SET category = 'Armazenamento' WHERE category = 'storage';