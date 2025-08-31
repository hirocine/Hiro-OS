-- Adicionar colunas detalhadas à tabela projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS withdrawal_user_id UUID,
ADD COLUMN IF NOT EXISTS withdrawal_notes TEXT,
ADD COLUMN IF NOT EXISTS return_condition TEXT CHECK (return_condition IN ('excellent', 'good', 'fair', 'damaged')),
ADD COLUMN IF NOT EXISTS return_notes TEXT;

-- Atualizar políticas RLS da tabela loans para torná-la invisível aos usuários
-- Remover políticas existentes que permitem acesso direto
DROP POLICY IF EXISTS "Admins can view all loans" ON public.loans;
DROP POLICY IF EXISTS "All authenticated users can insert loans" ON public.loans;  
DROP POLICY IF EXISTS "All authenticated users can update loans" ON public.loans;

-- Criar políticas mais restritivas - apenas sistema pode acessar
CREATE POLICY "System can manage loans internally" ON public.loans
FOR ALL USING (false) WITH CHECK (false);

-- Permitir apenas funções/triggers do sistema acessarem loans
CREATE POLICY "Allow system functions to access loans" ON public.loans
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Simplificar status dos equipamentos
ALTER TABLE public.equipments 
ADD COLUMN IF NOT EXISTS simplified_status TEXT DEFAULT 'available' 
CHECK (simplified_status IN ('available', 'in_project', 'maintenance', 'damaged'));

-- Função para atualizar status simplificado baseado em loans ativos
CREATE OR REPLACE FUNCTION update_equipment_simplified_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar status do equipamento baseado em loans
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.status IN ('active', 'overdue') THEN
      UPDATE public.equipments 
      SET simplified_status = 'in_project'
      WHERE id = NEW.equipment_id;
    ELSIF NEW.status = 'returned' THEN
      -- Verificar se não há outros loans ativos para este equipamento
      IF NOT EXISTS (
        SELECT 1 FROM public.loans 
        WHERE equipment_id = NEW.equipment_id 
        AND status IN ('active', 'overdue')
        AND id != NEW.id
      ) THEN
        UPDATE public.equipments 
        SET simplified_status = 'available'
        WHERE id = NEW.equipment_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Ao deletar loan, verificar se equipamento deve voltar a disponível
    IF NOT EXISTS (
      SELECT 1 FROM public.loans 
      WHERE equipment_id = OLD.equipment_id 
      AND status IN ('active', 'overdue')
    ) THEN
      UPDATE public.equipments 
      SET simplified_status = 'available'
      WHERE id = OLD.equipment_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para atualizar status simplificado
DROP TRIGGER IF EXISTS update_equipment_status_trigger ON public.loans;
CREATE TRIGGER update_equipment_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION update_equipment_simplified_status();

-- Atualizar status atual de todos os equipamentos
UPDATE public.equipments 
SET simplified_status = CASE 
  WHEN EXISTS (
    SELECT 1 FROM public.loans 
    WHERE equipment_id = equipments.id 
    AND status IN ('active', 'overdue')
  ) THEN 'in_project'
  ELSE 'available'
END;