-- Add withdrawal tracking columns to projects table
ALTER TABLE public.projects 
ADD COLUMN withdrawal_user_id UUID,
ADD COLUMN withdrawal_user_name TEXT,
ADD COLUMN withdrawal_time TIMESTAMP WITH TIME ZONE;

-- Add comment for clarity
COMMENT ON COLUMN public.projects.withdrawal_user_id IS 'ID of user who withdrew the equipment';
COMMENT ON COLUMN public.projects.withdrawal_user_name IS 'Name of user who withdrew the equipment for display purposes';
COMMENT ON COLUMN public.projects.withdrawal_time IS 'Timestamp when equipment was withdrawn';