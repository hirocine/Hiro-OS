-- Corrigir search_path das funções para segurança

-- Atualizar função de validação de projeto
CREATE OR REPLACE FUNCTION validate_project_exists()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verificar se o projeto existe
  IF NOT EXISTS (
    SELECT 1 FROM projects 
    WHERE name = NEW.project OR id::text = NEW.project
  ) THEN
    RAISE EXCEPTION 'Projeto "%" não encontrado', NEW.project;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Atualizar função de limpeza de empréstimos
CREATE OR REPLACE FUNCTION cleanup_project_loans()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Retornar todos os equipamentos do projeto deletado
  UPDATE loans 
  SET status = 'returned',
      actual_return_date = CURRENT_DATE,
      return_notes = 'Equipamento retornado automaticamente - projeto deletado',
      return_condition = 'good'
  WHERE (project = OLD.name OR project = OLD.id::text)
    AND status IN ('active', 'overdue');
  
  RETURN OLD;
END;
$$;