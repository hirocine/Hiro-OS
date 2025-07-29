-- Fix equipment category constraint to include 'storage'
-- Drop the existing constraint that's missing 'storage'
ALTER TABLE equipments DROP CONSTRAINT IF EXISTS equipments_category_check;

-- Add the updated constraint with all valid categories including 'storage'
ALTER TABLE equipments ADD CONSTRAINT equipments_category_check 
CHECK (category = ANY (ARRAY['camera'::text, 'audio'::text, 'lighting'::text, 'accessories'::text, 'storage'::text]));