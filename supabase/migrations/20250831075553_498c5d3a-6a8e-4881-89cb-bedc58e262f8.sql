-- Limpar empréstimos órfãos: retornar equipamentos que estão vinculados a projetos inexistentes
UPDATE loans 
SET status = 'returned',
    actual_return_date = CURRENT_DATE,
    return_notes = 'Equipamento retornado automaticamente - projeto não encontrado',
    return_condition = 'good'
WHERE status IN ('active', 'overdue')
  AND NOT EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.name = loans.project OR p.id::text = loans.project
  );

-- Atualizar status dos equipamentos para disponível
UPDATE equipments 
SET simplified_status = 'available',
    current_loan_id = NULL,
    current_borrower = NULL
WHERE id IN (
  SELECT DISTINCT l.equipment_id 
  FROM loans l
  LEFT JOIN projects p ON (l.project = p.name OR l.project = p.id::text)
  WHERE p.id IS NULL
);

-- Criar trigger para prevenir empréstimos órfãos no futuro
CREATE OR REPLACE FUNCTION validate_project_exists()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Aplicar trigger em inserções e atualizações de empréstimos
DROP TRIGGER IF EXISTS validate_loan_project ON loans;
CREATE TRIGGER validate_loan_project
  BEFORE INSERT OR UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION validate_project_exists();

-- Criar função para limpeza automática quando projeto é deletado
CREATE OR REPLACE FUNCTION cleanup_project_loans()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Aplicar trigger quando projeto é deletado
DROP TRIGGER IF EXISTS cleanup_loans_on_project_delete ON projects;
CREATE TRIGGER cleanup_loans_on_project_delete
  AFTER DELETE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_project_loans();