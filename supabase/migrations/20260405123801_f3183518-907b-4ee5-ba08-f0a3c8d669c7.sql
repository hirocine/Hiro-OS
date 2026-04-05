CREATE POLICY "Allow public update time_on_page" ON public.proposal_views
FOR UPDATE USING (true) WITH CHECK (true);