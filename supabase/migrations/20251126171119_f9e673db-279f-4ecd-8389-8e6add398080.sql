-- Atualizar constraint de status para incluir 'arquivada' no lugar de 'cancelada'
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('pendente', 'em_progresso', 'concluida', 'arquivada'));

-- Atualizar constraint de priority para incluir 'standby'
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;

ALTER TABLE public.tasks ADD CONSTRAINT tasks_priority_check 
  CHECK (priority IN ('baixa', 'media', 'alta', 'urgente', 'standby'));