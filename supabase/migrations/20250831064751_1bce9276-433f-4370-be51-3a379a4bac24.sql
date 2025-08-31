-- Corrigir função com search_path correto
CREATE OR REPLACE FUNCTION public.sync_project_equipment()
RETURNS TRIGGER AS $$
DECLARE
  project_record RECORD;
  loan_ids_array UUID[];
  equipment_count_val INTEGER;
BEGIN
  -- Determinar qual projeto foi afetado
  IF TG_OP = 'DELETE' THEN
    -- Para DELETE, usar OLD para obter o projeto
    SELECT * INTO project_record FROM public.projects WHERE name = OLD.project OR id::text = OLD.project;
  ELSE
    -- Para INSERT/UPDATE, usar NEW
    SELECT * INTO project_record FROM public.projects WHERE name = NEW.project OR id::text = NEW.project;
  END IF;

  -- Se não encontrar o projeto, sair
  IF project_record IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Buscar todos os empréstimos ativos/em atraso do projeto
  SELECT 
    ARRAY_AGG(l.id) AS loan_ids,
    COUNT(*) AS equipment_count
  INTO loan_ids_array, equipment_count_val
  FROM public.loans l
  WHERE (l.project = project_record.name OR l.project = project_record.id::text)
    AND l.status IN ('active', 'overdue');

  -- Se não há empréstimos, definir arrays vazios
  IF loan_ids_array IS NULL THEN
    loan_ids_array := '{}';
    equipment_count_val := 0;
  END IF;

  -- Atualizar o projeto
  UPDATE public.projects 
  SET 
    equipment_count = equipment_count_val,
    loan_ids = loan_ids_array,
    updated_at = now()
  WHERE id = project_record.id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';