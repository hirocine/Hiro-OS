-- =========================================
-- CRITICAL SECURITY FIX: Platform Accesses RLS
-- =========================================
-- Problema: Qualquer usuário autenticado pode ver TODAS as senhas de TODOS os usuários
-- Solução: Restringir acesso apenas ao próprio usuário

-- 1. Remover política insegura atual
DROP POLICY IF EXISTS "Authenticated users can view all accesses" ON public.platform_accesses;

-- 2. Criar nova política segura - usuários só veem seus próprios acessos
CREATE POLICY "Users can view own platform accesses"
ON public.platform_accesses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- =========================================
-- REVIEW: Borrower Contacts & Profiles RLS
-- =========================================
-- As políticas existentes estão corretas:
-- - borrower_contacts: apenas admins e responsáveis do projeto
-- - profiles: usuários veem apenas próprio perfil, admins veem tudo
-- Nenhuma alteração necessária nessas tabelas.