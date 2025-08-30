-- Fix the search path for the function to address security warning
CREATE OR REPLACE FUNCTION public.update_project_name()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If we have the new fields, construct the name from them
  IF NEW.project_number IS NOT NULL AND NEW.company IS NOT NULL AND NEW.project_name IS NOT NULL THEN
    NEW.name = NEW.project_number || ' - ' || NEW.company || ': ' || NEW.project_name;
  END IF;
  
  RETURN NEW;
END;
$$;