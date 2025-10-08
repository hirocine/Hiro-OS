-- Add display_order column to equipments table for vertical sorting within each status
ALTER TABLE public.equipments
ADD COLUMN display_order INTEGER;

-- Create index for efficient ordering queries
CREATE INDEX idx_equipments_status_order 
ON public.equipments (simplified_status, display_order NULLS LAST);

-- Add comment to explain the column
COMMENT ON COLUMN public.equipments.display_order IS 'Position of equipment within its status column (0, 1, 2...). NULL values appear last.';
