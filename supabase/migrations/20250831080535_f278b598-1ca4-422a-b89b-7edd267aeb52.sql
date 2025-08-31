-- Correção completa dos equipamentos "em uso" - Versão corrigida

-- Etapa 1: Limpeza dos dados órfãos
-- Limpar referências de empréstimos inexistentes
UPDATE equipments 
SET 
  current_loan_id = NULL,
  current_borrower = NULL,
  last_loan_date = NULL,
  simplified_status = 'available'
WHERE current_loan_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM loans 
    WHERE loans.id = equipments.current_loan_id
  );

-- Corrigir simplified_status para equipamentos sem empréstimos ativos
UPDATE equipments 
SET simplified_status = 'available'
WHERE simplified_status = 'in_project'
  AND NOT EXISTS (
    SELECT 1 FROM loans 
    WHERE loans.equipment_id = equipments.id 
    AND loans.status IN ('active', 'overdue')
  );

-- Etapa 2: Criar função de sincronização de equipamentos
CREATE OR REPLACE FUNCTION sync_equipment_loan_status()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Para INSERT e UPDATE de loans
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Se loan está ativo ou em atraso, atualizar equipamento
    IF NEW.status IN ('active', 'overdue') THEN
      UPDATE equipments 
      SET 
        current_loan_id = NEW.id,
        current_borrower = NEW.borrower_name,
        last_loan_date = NEW.loan_date,
        simplified_status = 'in_project'
      WHERE id = NEW.equipment_id;
    
    -- Se loan foi retornado, verificar se há outros loans ativos
    ELSIF NEW.status = 'returned' THEN
      -- Verificar se há outros empréstimos ativos para este equipamento
      IF NOT EXISTS (
        SELECT 1 FROM loans 
        WHERE equipment_id = NEW.equipment_id 
        AND status IN ('active', 'overdue')
        AND id != NEW.id
      ) THEN
        -- Não há outros empréstimos ativos, limpar referências
        UPDATE equipments 
        SET 
          current_loan_id = NULL,
          current_borrower = NULL,
          simplified_status = 'available'
        WHERE id = NEW.equipment_id;
      ELSE
        -- Há outros empréstimos ativos, atualizar para o mais recente
        UPDATE equipments 
        SET 
          current_loan_id = (
            SELECT id FROM loans 
            WHERE equipment_id = NEW.equipment_id 
            AND status IN ('active', 'overdue')
            ORDER BY loan_date DESC 
            LIMIT 1
          ),
          current_borrower = (
            SELECT borrower_name FROM loans 
            WHERE equipment_id = NEW.equipment_id 
            AND status IN ('active', 'overdue')
            ORDER BY loan_date DESC 
            LIMIT 1
          )
        WHERE id = NEW.equipment_id;
      END IF;
    END IF;
  END IF;

  -- Para DELETE de loans
  IF TG_OP = 'DELETE' THEN
    -- Se o loan deletado era o current_loan_id, limpar ou atualizar
    UPDATE equipments 
    SET 
      current_loan_id = CASE 
        WHEN current_loan_id = OLD.id THEN (
          SELECT id FROM loans 
          WHERE equipment_id = OLD.equipment_id 
          AND status IN ('active', 'overdue')
          ORDER BY loan_date DESC 
          LIMIT 1
        )
        ELSE current_loan_id
      END,
      current_borrower = CASE 
        WHEN current_loan_id = OLD.id THEN (
          SELECT borrower_name FROM loans 
          WHERE equipment_id = OLD.equipment_id 
          AND status IN ('active', 'overdue')
          ORDER BY loan_date DESC 
          LIMIT 1
        )
        ELSE current_borrower
      END,
      simplified_status = CASE 
        WHEN NOT EXISTS (
          SELECT 1 FROM loans 
          WHERE equipment_id = OLD.equipment_id 
          AND status IN ('active', 'overdue')
        ) THEN 'available'
        ELSE 'in_project'
      END
    WHERE id = OLD.equipment_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Etapa 3: Criar triggers para sincronização automática
DROP TRIGGER IF EXISTS sync_equipment_on_loan_change ON loans;
CREATE TRIGGER sync_equipment_on_loan_change
  AFTER INSERT OR UPDATE OR DELETE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION sync_equipment_loan_status();

-- Etapa 4: Função de sincronização manual simplificada
CREATE OR REPLACE FUNCTION manual_sync_equipment_status()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Corrigir equipamentos com referências órfãs
  UPDATE equipments 
  SET 
    current_loan_id = NULL,
    current_borrower = NULL,
    simplified_status = 'available'
  WHERE current_loan_id IS NOT NULL 
    AND NOT EXISTS (
      SELECT 1 FROM loans 
      WHERE loans.id = equipments.current_loan_id
      AND loans.status IN ('active', 'overdue')
    );
  
  -- Corrigir equipamentos sem empréstimos ativos mas marcados como in_project
  UPDATE equipments 
  SET simplified_status = 'available'
  WHERE simplified_status = 'in_project'
    AND NOT EXISTS (
      SELECT 1 FROM loans 
      WHERE loans.equipment_id = equipments.id 
      AND loans.status IN ('active', 'overdue')
    );
  
  -- Atualizar equipamentos que deveriam ter referências atualizadas
  UPDATE equipments 
  SET 
    current_loan_id = l.id,
    current_borrower = l.borrower_name,
    last_loan_date = l.loan_date,
    simplified_status = 'in_project'
  FROM (
    SELECT DISTINCT ON (equipment_id) 
      id, equipment_id, borrower_name, loan_date
    FROM loans 
    WHERE status IN ('active', 'overdue')
    ORDER BY equipment_id, loan_date DESC
  ) l
  WHERE equipments.id = l.equipment_id
    AND (
      equipments.current_loan_id IS NULL 
      OR equipments.current_loan_id != l.id
      OR equipments.simplified_status != 'in_project'
    );
END;
$$;

-- Etapa 5: Executar sincronização inicial
SELECT manual_sync_equipment_status();

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS update_equipment_status_on_loan_change ON loans;