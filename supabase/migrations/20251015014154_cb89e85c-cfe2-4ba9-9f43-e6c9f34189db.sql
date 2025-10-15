-- Add expected_return_date column to equipments table
ALTER TABLE public.equipments 
ADD COLUMN expected_return_date date NULL;

COMMENT ON COLUMN public.equipments.expected_return_date IS 'Data esperada de devolução quando equipamento está emprestado';