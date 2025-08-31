-- REESTRUTURAÇÃO COMPLETA DA BASE DE DADOS DE PROJETOS (CORRIGIDA)
-- Limpeza, Migração e Sincronização de Dados

-- 1. LIMPEZA: Criar projetos para empréstimos órfãos
INSERT INTO public.projects (
  name, 
  description, 
  start_date, 
  expected_end_date, 
  status, 
  step, 
  responsible_name, 
  responsible_email, 
  department,
  equipment_count,
  loan_ids
) 
SELECT DISTINCT 
  l.project as name,
  'Projeto criado automaticamente para empréstimos existentes' as description,
  CURRENT_DATE as start_date,
  CURRENT_DATE + INTERVAL '30 days' as expected_end_date,
  'active' as status,
  'in_use' as step,
  'Sistema' as responsible_name,
  'sistema@empresa.com' as responsible_email,
  'Não especificado' as department,
  0 as equipment_count,
  ARRAY[]::UUID[] as loan_ids
FROM public.loans l
WHERE l.project IS NOT NULL 
  AND l.project NOT IN (
    SELECT name FROM public.projects 
    UNION 
    SELECT id::text FROM public.projects
  )
  AND l.status IN ('active', 'overdue')
ON CONFLICT (name) DO NOTHING;

-- 2. SINCRONIZAÇÃO: Atualizar todos os projetos com contagem correta de equipamentos
UPDATE public.projects 
SET 
  equipment_count = COALESCE(loan_counts.equipment_count, 0),
  loan_ids = COALESCE(loan_counts.loan_ids, ARRAY[]::UUID[]),
  updated_at = now()
FROM (
  SELECT 
    p.id as project_id,
    COUNT(l.id) as equipment_count,
    ARRAY_AGG(l.id) as loan_ids
  FROM public.projects p
  LEFT JOIN public.loans l ON (
    l.project = p.name OR l.project = p.id::text
  ) AND l.status IN ('active', 'overdue')
  GROUP BY p.id
) as loan_counts
WHERE projects.id = loan_counts.project_id;

-- 3. TRIGGERS: Garantir que os triggers estão funcionando corretamente
DROP TRIGGER IF EXISTS sync_project_equipment_trigger ON public.loans;
DROP TRIGGER IF EXISTS update_equipment_simplified_status_trigger ON public.loans;

-- Recriar trigger de sincronização de projetos
CREATE TRIGGER sync_project_equipment_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION sync_project_equipment();

-- Recriar trigger de status de equipamentos
CREATE TRIGGER update_equipment_simplified_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_simplified_status();

-- 4. ÍNDICES: Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_loans_project ON public.loans(project);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_equipment_id ON public.loans(equipment_id);
CREATE INDEX IF NOT EXISTS idx_projects_name ON public.projects(name);

-- 5. VALIDAÇÃO: Executar uma última sincronização para garantir dados corretos
DO $$
DECLARE
  project_rec RECORD;
  loan_count INTEGER;
  loan_ids_array UUID[];
BEGIN
  FOR project_rec IN SELECT * FROM public.projects LOOP
    -- Contar empréstimos ativos para este projeto
    SELECT 
      COUNT(*),
      ARRAY_AGG(l.id) 
    INTO loan_count, loan_ids_array
    FROM public.loans l
    WHERE (l.project = project_rec.name OR l.project = project_rec.id::text)
      AND l.status IN ('active', 'overdue');
    
    -- Garantir valores padrão
    IF loan_count IS NULL THEN loan_count := 0; END IF;
    IF loan_ids_array IS NULL THEN loan_ids_array := ARRAY[]::UUID[]; END IF;
    
    -- Atualizar projeto
    UPDATE public.projects 
    SET 
      equipment_count = loan_count,
      loan_ids = loan_ids_array,
      updated_at = now()
    WHERE id = project_rec.id;
  END LOOP;
  
  RAISE NOTICE 'Sincronização completa finalizada para todos os projetos';
END;
$$;