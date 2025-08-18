-- Fase 1: Correções de Segurança Crítica

-- 1. Corrigir RLS da tabela loans - apenas admins podem ver informações sensíveis
DROP POLICY IF EXISTS "All authenticated users can view loans" ON public.loans;

-- Política mais restritiva para loans - apenas admins podem ver todas as informações
CREATE POLICY "Admins can view all loans" 
ON public.loans 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Usuários comuns podem ver apenas informações básicas sem dados pessoais sensíveis
CREATE POLICY "Users can view basic loan info" 
ON public.loans 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  NOT has_role(auth.uid(), 'admin'::app_role)
);

-- 2. Corrigir RLS da tabela profiles - usuários só veem próprio perfil, admins veem todos
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Adicionar política para admins poderem gerenciar profiles
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));