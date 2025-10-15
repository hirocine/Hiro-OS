-- Função que retorna equipamentos quando projeto é finalizado
CREATE OR REPLACE FUNCTION public.complete_project_loans()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  project_name_val TEXT;
  project_id_val UUID;
BEGIN
  -- Verificar se o projeto mudou para 'completed'
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    project_name_val := NEW.name;
    project_id_val := NEW.id;
    
    -- Retornar todos os equipamentos ativos do projeto
    UPDATE loans 
    SET 
      status = 'returned',
      actual_return_date = CURRENT_DATE,
      return_notes = 'Equipamento retornado automaticamente - projeto finalizado',
      return_condition = 'good'
    WHERE (project = project_name_val OR project = project_id_val::text)
      AND status IN ('active', 'overdue');
      
    -- O trigger handle_loan_notifications já vai criar as notificações automaticamente
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
CREATE TRIGGER auto_return_loans_on_project_completion
  AFTER UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.complete_project_loans();