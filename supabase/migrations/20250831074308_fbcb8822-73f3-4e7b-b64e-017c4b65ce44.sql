-- Limpar todo o histórico de empréstimos
-- Os triggers irão automaticamente atualizar os projetos e equipamentos

DELETE FROM public.loans;

-- Opcional: Resetar a sequência se existir (para próximos IDs começarem do início)
-- Como usamos UUID, não é necessário, mas vamos garantir consistência

-- Atualizar equipamentos para status disponível (caso algum trigger não tenha funcionado)
UPDATE public.equipments 
SET 
  simplified_status = 'available',
  current_loan_id = NULL,
  current_borrower = NULL,
  last_loan_date = NULL
WHERE simplified_status = 'in_project';

-- Atualizar projetos para equipment_count = 0 e loan_ids vazios (caso algum trigger não tenha funcionado)
UPDATE public.projects 
SET 
  equipment_count = 0,
  loan_ids = '{}',
  updated_at = now()
WHERE equipment_count > 0 OR array_length(loan_ids, 1) > 0;