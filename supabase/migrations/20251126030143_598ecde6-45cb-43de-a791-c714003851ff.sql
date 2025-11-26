-- Camada 1: Proteção via RLS Policies (Segurança Real)
-- Remover políticas antigas de SELECT que permitem acesso a todos usuários autenticados

DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can view supplier roles" ON public.supplier_roles;
DROP POLICY IF EXISTS "Authenticated users can view supplier notes" ON public.supplier_notes;

-- Criar novas políticas restritivas - apenas admins podem visualizar dados

CREATE POLICY "Admins can view suppliers" 
  ON public.suppliers
  FOR SELECT 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view supplier roles" 
  ON public.supplier_roles
  FOR SELECT 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view supplier notes" 
  ON public.supplier_notes
  FOR SELECT 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));