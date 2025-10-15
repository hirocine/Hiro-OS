-- Criar trigger para registrar logs de empréstimos
CREATE OR REPLACE FUNCTION public.log_loan_actions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Empréstimo criado
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_entry(
      'create_loan',
      'loans',
      NEW.id::text,
      NULL,
      jsonb_build_object(
        'equipment_name', NEW.equipment_name,
        'borrower_name', NEW.borrower_name,
        'project', NEW.project,
        'loan_date', NEW.loan_date,
        'expected_return_date', NEW.expected_return_date
      )
    );
  END IF;

  -- Equipamento devolvido
  IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status = 'returned' THEN
    PERFORM public.log_audit_entry(
      'return_equipment',
      'loans',
      NEW.id::text,
      jsonb_build_object(
        'status', OLD.status,
        'actual_return_date', OLD.actual_return_date
      ),
      jsonb_build_object(
        'status', NEW.status,
        'actual_return_date', NEW.actual_return_date,
        'return_condition', NEW.return_condition,
        'return_notes', NEW.return_notes
      )
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Criar trigger na tabela loans
DROP TRIGGER IF EXISTS trigger_log_loan_actions ON public.loans;
CREATE TRIGGER trigger_log_loan_actions
  AFTER INSERT OR UPDATE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.log_loan_actions();