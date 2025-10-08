-- Add capacity field to equipments table
ALTER TABLE public.equipments 
ADD COLUMN IF NOT EXISTS capacity NUMERIC;