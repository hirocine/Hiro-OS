-- Função para sincronizar dados do projeto com empréstimos
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar triggers para sincronização automática
DROP TRIGGER IF EXISTS sync_project_equipment_on_insert ON public.loans;
DROP TRIGGER IF EXISTS sync_project_equipment_on_update ON public.loans;
DROP TRIGGER IF EXISTS sync_project_equipment_on_delete ON public.loans;

CREATE TRIGGER sync_project_equipment_on_insert
  AFTER INSERT ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_project_equipment();

CREATE TRIGGER sync_project_equipment_on_update
  AFTER UPDATE ON public.loans
  FOR EACH ROW
  WHEN (OLD.project IS DISTINCT FROM NEW.project OR OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.sync_project_equipment();

CREATE TRIGGER sync_project_equipment_on_delete
  AFTER DELETE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_project_equipment();