-- Reestruturar visualização de tarefas: permitir que todos vejam todas as tarefas

-- 1. Atualizar policy de SELECT para permitir visualização universal
DROP POLICY IF EXISTS "Users can view accessible tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can view all tasks" ON tasks;

CREATE POLICY "Authenticated users can view all tasks" 
ON tasks FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 2. Simplificar função can_access_task para acesso universal
CREATE OR REPLACE FUNCTION public.can_access_task(_task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT auth.uid() IS NOT NULL
$$;