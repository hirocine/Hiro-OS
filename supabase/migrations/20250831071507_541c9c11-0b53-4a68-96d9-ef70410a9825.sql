-- REESTRUTURAÇÃO COMPLETA DA BASE DE DADOS DE PROJETOS (FINAL)
-- Limpeza, Migração e Sincronização de Dados

-- 1. LIMPEZA: Criar projetos para empréstimos órfãos (apenas se não existirem)
DO $$
DECLARE
  orphan_project TEXT;
BEGIN
  FOR orphan_project IN 
    SELECT DISTINCT l.project
    FROM public.loans l
    WHERE l.project IS NOT NULL 
      AND l.project NOT IN (
        SELECT name FROM public.projects 
        UNION 
        SELECT id::text FROM public.projects
      )
      AND l.status IN ('active', 'overdue')
  LOOP
    -- Verificar se o projeto já existe antes de inserir
    IF NOT EXISTS (SELECT 1 FROM public.projects WHERE name = orphan_project) THEN
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
      ) VALUES (
        orphan_project,
        'Projeto criado automaticamente para empréstimos existentes',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        'active',
        'in_use',
        'Sistema',
        'sistema@empresa.com',
        'Não especificado',
        0,
        ARRAY[]::UUID[]
      );
      
      RAISE NOTICE 'Projeto criado: %', orphan_project;
    END IF;
  END LOOP;
END;
$$;

-- 2. SINCRONIZAÇÃO: Atualizar todos os projetos com contagem correta de equipamentos
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
      CASE 
        WHEN COUNT(*) > 0 THEN ARRAY_AGG(l.id) 
        ELSE ARRAY[]::UUID[]
      END
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
    
    RAISE NOTICE 'Projeto % atualizado: % equipamentos', project_rec.name, loan_count;
  END LOOP;
  
  RAISE NOTICE 'Sincronização completa finalizada para todos os projetos';
END;
$$;

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

-- 5. ATUALIZAR STATUS DOS EQUIPAMENTOS
UPDATE public.equipments 
SET simplified_status = 'in_project'
WHERE id IN (
  SELECT DISTINCT l.equipment_id 
  FROM public.loans l 
  WHERE l.status IN ('active', 'overdue')
);

UPDATE public.equipments 
SET simplified_status = 'available'
WHERE id NOT IN (
  SELECT DISTINCT l.equipment_id 
  FROM public.loans l 
  WHERE l.status IN ('active', 'overdue')
);

-- 6. LOGS FINAIS
DO $$
DECLARE
  total_projects INTEGER;
  total_loans INTEGER;
  total_equipment INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_projects FROM public.projects;
  SELECT COUNT(*) INTO total_loans FROM public.loans WHERE status IN ('active', 'overdue');
  SELECT COUNT(*) INTO total_equipment FROM public.equipments WHERE simplified_status = 'in_project';
  
  RAISE NOTICE 'RESUMO FINAL:';
  RAISE NOTICE '- Total de projetos: %', total_projects;
  RAISE NOTICE '- Total de empréstimos ativos: %', total_loans;
  RAISE NOTICE '- Total de equipamentos em projetos: %', total_equipment;
END;
$$;