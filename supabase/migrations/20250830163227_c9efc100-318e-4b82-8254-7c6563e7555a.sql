-- Add recording_type column to projects table
ALTER TABLE public.projects 
ADD COLUMN recording_type TEXT;