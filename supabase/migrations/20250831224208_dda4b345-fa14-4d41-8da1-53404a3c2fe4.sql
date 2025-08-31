-- Add missing withdrawal columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS withdrawal_user_name TEXT,
ADD COLUMN IF NOT EXISTS withdrawal_time TIMESTAMP WITH TIME ZONE;

-- Add comments for clarity
COMMENT ON COLUMN public.projects.withdrawal_user_name IS 'Name of user who withdrew the equipment for display purposes';
COMMENT ON COLUMN public.projects.withdrawal_time IS 'Timestamp when equipment was withdrawn';