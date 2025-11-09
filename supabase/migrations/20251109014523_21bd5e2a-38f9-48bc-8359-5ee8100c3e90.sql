-- Remover constraint NOT NULL da coluna category e subcategory
ALTER TABLE public.equipments 
ALTER COLUMN category DROP NOT NULL;

ALTER TABLE public.equipments 
ALTER COLUMN subcategory DROP NOT NULL;

-- Limpar todas as categorias e subcategorias dos equipamentos
UPDATE public.equipments 
SET category = NULL, subcategory = NULL 
WHERE id IS NOT NULL;