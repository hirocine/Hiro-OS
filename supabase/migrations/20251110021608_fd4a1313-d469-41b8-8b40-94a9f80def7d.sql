-- Remove duplicates from equipments table (keep oldest by created_at)
WITH dups AS (
  SELECT id, patrimony_number,
         ROW_NUMBER() OVER (PARTITION BY patrimony_number ORDER BY created_at ASC) AS rn
  FROM public.equipments
  WHERE patrimony_number IS NOT NULL
)
DELETE FROM public.equipments e
USING dups
WHERE e.id = dups.id AND dups.rn > 1;

-- Create partial unique index on patrimony_number (allows NULL but enforces uniqueness for non-NULL values)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_equipments_patrimony
ON public.equipments (patrimony_number)
WHERE patrimony_number IS NOT NULL;