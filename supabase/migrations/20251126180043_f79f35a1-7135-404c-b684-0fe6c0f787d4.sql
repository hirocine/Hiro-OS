-- Permitir que todos usuários autenticados vejam todos os equipamentos
CREATE POLICY "All authenticated users can view all equipments"
ON public.equipments
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Permitir que todos usuários autenticados vejam todos os acessos de plataforma
CREATE POLICY "All authenticated users can view all platform accesses"
ON public.platform_accesses
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);