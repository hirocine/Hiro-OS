-- Função auxiliar para verificar se um equipamento é SSD/HD
CREATE OR REPLACE FUNCTION public.is_storage_device(_equipment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.equipments
    WHERE id = _equipment_id
      AND category = 'storage'
      AND (subcategory ILIKE '%ssd%' OR subcategory ILIKE '%hd%')
  );
$$;

-- Atualizar trigger de sync para ignorar SSDs/HDs
CREATE OR REPLACE FUNCTION public.sync_equipment_loan_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Verificar se é um dispositivo de armazenamento (SSD/HD)
  -- Se for, não atualizar os campos de loan, apenas retornar
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    -- Apenas atualizar se NÃO for SSD/HD
    IF NOT public.is_storage_device(NEW.equipment_id) THEN
      UPDATE equipments 
      SET 
        current_borrower = NEW.borrower_name,
        current_loan_id = NEW.id,
        last_loan_date = NEW.loan_date
      WHERE id = NEW.equipment_id;
    END IF;
    
  ELSIF TG_OP = 'UPDATE' THEN
    IF NOT public.is_storage_device(NEW.equipment_id) THEN
      IF OLD.status = 'active' AND NEW.status = 'returned' THEN
        UPDATE equipments 
        SET 
          current_borrower = (
            SELECT borrower_name 
            FROM loans 
            WHERE equipment_id = NEW.equipment_id 
              AND status = 'active' 
            ORDER BY loan_date DESC, created_at DESC 
            LIMIT 1
          ),
          current_loan_id = (
            SELECT id 
            FROM loans 
            WHERE equipment_id = NEW.equipment_id 
              AND status = 'active' 
            ORDER BY loan_date DESC, created_at DESC 
            LIMIT 1
          )
        WHERE id = NEW.equipment_id;
      END IF;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    IF NOT public.is_storage_device(OLD.equipment_id) THEN
      UPDATE equipments 
      SET 
        current_borrower = (
          SELECT borrower_name 
          FROM loans 
          WHERE equipment_id = OLD.equipment_id 
            AND status = 'active' 
          ORDER BY loan_date DESC, created_at DESC 
          LIMIT 1
        ),
        current_loan_id = (
          SELECT id 
          FROM loans 
          WHERE equipment_id = OLD.equipment_id 
            AND status = 'active' 
          ORDER BY loan_date DESC, created_at DESC 
          LIMIT 1
        )
      WHERE id = OLD.equipment_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Atualizar trigger de simplified_status para ignorar SSDs/HDs
CREATE OR REPLACE FUNCTION public.update_equipment_simplified_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Verificar se é um dispositivo de armazenamento (SSD/HD)
  -- Se for, não atualizar o simplified_status
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NOT public.is_storage_device(NEW.equipment_id) THEN
      IF NEW.status IN ('active', 'overdue') THEN
        UPDATE public.equipments 
        SET simplified_status = 'in_project'
        WHERE id = NEW.equipment_id;
      ELSIF NEW.status = 'returned' THEN
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
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF NOT public.is_storage_device(OLD.equipment_id) THEN
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
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;