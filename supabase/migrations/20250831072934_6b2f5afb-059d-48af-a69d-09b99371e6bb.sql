-- Primeiro, remover as políticas existentes que estão causando problema
DROP POLICY IF EXISTS "Allow system functions to access loans" ON public.loans;
DROP POLICY IF EXISTS "System can manage loans internally" ON public.loans;

-- Adicionar políticas RLS corretas para permitir operações de usuários autenticados
CREATE POLICY "All authenticated users can view loans"
ON public.loans
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can insert loans"
ON public.loans
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can update loans"
ON public.loans
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Manter a política de DELETE apenas para admins
-- (a política "Admins can delete loans" já exists)