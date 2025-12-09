-- Add column to store original photo URL for team members
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS original_photo_url text;