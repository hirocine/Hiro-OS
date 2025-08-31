-- Recriar triggers para sincronização automática de projetos e equipamentos
-- 1. Garantir que a função de sincronização existe
CREATE OR REPLACE FUNCTION sync_project_equipment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- 2. Recriar as triggers na tabela loans
DROP TRIGGER IF EXISTS sync_project_equipment_trigger ON public.loans;
CREATE TRIGGER sync_project_equipment_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION sync_project_equipment();

-- 3. Executar sincronização manual para todos os projetos existentes
DO $$
DECLARE
  project_rec RECORD;
  loan_ids_array UUID[];
  equipment_count_val INTEGER;
BEGIN
  FOR project_rec IN SELECT * FROM public.projects LOOP
    -- Buscar todos os empréstimos ativos/em atraso do projeto
    SELECT 
      ARRAY_AGG(l.id) AS loan_ids,
      COUNT(*) AS equipment_count
    INTO loan_ids_array, equipment_count_val
    FROM public.loans l
    WHERE (l.project = project_rec.name OR l.project = project_rec.id::text)
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
    WHERE id = project_rec.id;
  END LOOP;
END;
$$;

-- 4. Criar função para buscar empréstimos de projeto com fallback
CREATE OR REPLACE FUNCTION get_project_loans_with_fallback(_project_id UUID)
RETURNS TABLE (
  loan_id UUID,
  equipment_id UUID,
  equipment_name TEXT,
  borrower_name TEXT,
  loan_date DATE,
  expected_return_date DATE,
  status TEXT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    l.id,
    l.equipment_id,
    l.equipment_name,
    l.borrower_name,
    l.loan_date,
    l.expected_return_date,
    l.status
  FROM public.loans l
  INNER JOIN public.projects p ON (l.project = p.name OR l.project = p.id::text)
  WHERE p.id = _project_id 
    AND l.status IN ('active', 'overdue')
  ORDER BY l.loan_date DESC;
$$;