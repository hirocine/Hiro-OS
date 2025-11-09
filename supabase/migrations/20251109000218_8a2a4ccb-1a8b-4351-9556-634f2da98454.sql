-- Remove category CHECK constraint (categories are dynamic via equipment_categories table)
ALTER TABLE public.equipments DROP CONSTRAINT IF EXISTS equipments_category_check;

-- Update status CHECK constraint to include 'loaned'
ALTER TABLE public.equipments DROP CONSTRAINT IF EXISTS equipments_status_check;
ALTER TABLE public.equipments
  ADD CONSTRAINT equipments_status_check
  CHECK (status IN ('available', 'maintenance', 'loaned'));