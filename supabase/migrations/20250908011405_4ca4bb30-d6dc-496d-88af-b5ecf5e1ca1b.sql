-- Temporary policy to allow unauthenticated users to view equipments
-- This is a development/demo policy and should be removed in production
CREATE POLICY "Allow unauthenticated users to view equipments (temporary)" 
ON public.equipments 
FOR SELECT 
USING (true);