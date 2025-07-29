-- Add subcategory and custom_category columns to equipments table
ALTER TABLE public.equipments 
ADD COLUMN subcategory TEXT,
ADD COLUMN custom_category TEXT;

-- Create equipment_categories table for dynamic category management
CREATE TABLE public.equipment_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    subcategory TEXT NOT NULL,
    is_custom BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(category, subcategory)
);

-- Enable RLS on equipment_categories
ALTER TABLE public.equipment_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for equipment_categories
CREATE POLICY "All authenticated users can view categories"
ON public.equipment_categories
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can insert categories"
ON public.equipment_categories
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update categories"
ON public.equipment_categories
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete categories"
ON public.equipment_categories
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default subcategories
INSERT INTO public.equipment_categories (category, subcategory, is_custom) VALUES
-- Camera subcategories
('camera', 'Lente', false),
('camera', 'Cage', false),
('camera', 'Case', false),
('camera', 'Bateria', false),
('camera', 'Monitor', false),
('camera', 'Transmissão', false),
('camera', 'Carregador', false),
('camera', 'Filtro', false),
('camera', 'Cabo', false),

-- Audio subcategories
('audio', 'Microfone', false),
('audio', 'Gravador', false),
('audio', 'Cabo', false),

-- Lighting subcategories
('lighting', 'Tripé de Luz', false),
('lighting', 'Luz', false),
('lighting', 'Modificador de Luz', false),

-- Accessories subcategories
('accessories', 'Tripé de Câmera', false),
('accessories', 'Case', false),
('accessories', 'Bateria', false),
('accessories', 'Cabo', false),
('accessories', 'Filtro', false),

-- Storage subcategories (new category)
('storage', 'SSD/HD', false),
('storage', 'Cartão de Memória', false),
('storage', 'Leitor de Cartão', false);