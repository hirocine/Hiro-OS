-- Remover políticas SELECT conflitantes (todas RESTRICTIVE que causam o problema)
DROP POLICY IF EXISTS "Admins can view all equipments" ON equipments;
DROP POLICY IF EXISTS "All authenticated users can view all equipments" ON equipments;
DROP POLICY IF EXISTS "Users can view equipments from their projects" ON equipments;

-- Criar política única PERMISSIVE para todos os usuários autenticados
CREATE POLICY "Authenticated users can view equipments"
ON equipments
FOR SELECT
TO authenticated
USING (true);