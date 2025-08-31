-- Corrigir search_path nas funções para resolver aviso de segurança
CREATE OR REPLACE FUNCTION update_equipment_simplified_status()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;