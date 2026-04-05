CREATE POLICY "Allow public read by slug" ON public.orcamentos
FOR SELECT
USING (true);