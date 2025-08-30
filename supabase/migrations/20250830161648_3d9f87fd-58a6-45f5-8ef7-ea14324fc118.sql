-- Add new fields to projects table for the new withdrawal flow
ALTER TABLE public.projects 
ADD COLUMN project_number VARCHAR(4),
ADD COLUMN company TEXT,
ADD COLUMN project_name TEXT,
ADD COLUMN responsible_user_id UUID REFERENCES auth.users(id),
ADD COLUMN withdrawal_date DATE,
ADD COLUMN separation_date DATE;

-- Create index for better performance on user lookups
CREATE INDEX idx_projects_responsible_user_id ON public.projects(responsible_user_id);

-- Update trigger to handle the new project naming structure
CREATE OR REPLACE FUNCTION public.update_project_name()
RETURNS TRIGGER AS $$
BEGIN
  -- If we have the new fields, construct the name from them
  IF NEW.project_number IS NOT NULL AND NEW.company IS NOT NULL AND NEW.project_name IS NOT NULL THEN
    NEW.name = NEW.project_number || ' - ' || NEW.company || ': ' || NEW.project_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update project name
CREATE TRIGGER trigger_update_project_name
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_name();