-- marketing_pillars
DROP POLICY IF EXISTS "Authenticated can view marketing_pillars" ON public.marketing_pillars;
DROP POLICY IF EXISTS "Authenticated can insert marketing_pillars" ON public.marketing_pillars;
DROP POLICY IF EXISTS "Authenticated can update marketing_pillars" ON public.marketing_pillars;
DROP POLICY IF EXISTS "Authenticated can delete marketing_pillars" ON public.marketing_pillars;
CREATE POLICY "Marketing access can view pillars" ON public.marketing_pillars
  FOR SELECT TO authenticated USING (public.has_marketing_access(auth.uid()));
CREATE POLICY "Marketing access can insert pillars" ON public.marketing_pillars
  FOR INSERT TO authenticated WITH CHECK (public.has_marketing_access(auth.uid()));
CREATE POLICY "Marketing access can update pillars" ON public.marketing_pillars
  FOR UPDATE TO authenticated USING (public.has_marketing_access(auth.uid())) WITH CHECK (public.has_marketing_access(auth.uid()));
CREATE POLICY "Marketing access can delete pillars" ON public.marketing_pillars
  FOR DELETE TO authenticated USING (public.has_marketing_access(auth.uid()));

-- marketing_posts
DROP POLICY IF EXISTS "Authenticated can view marketing_posts" ON public.marketing_posts;
DROP POLICY IF EXISTS "Authenticated can insert marketing_posts" ON public.marketing_posts;
DROP POLICY IF EXISTS "Authenticated can update marketing_posts" ON public.marketing_posts;
DROP POLICY IF EXISTS "Authenticated can delete marketing_posts" ON public.marketing_posts;
CREATE POLICY "Marketing access can view posts" ON public.marketing_posts
  FOR SELECT TO authenticated USING (public.has_marketing_access(auth.uid()));
CREATE POLICY "Marketing access can insert posts" ON public.marketing_posts
  FOR INSERT TO authenticated WITH CHECK (public.has_marketing_access(auth.uid()));
CREATE POLICY "Marketing access can update posts" ON public.marketing_posts
  FOR UPDATE TO authenticated USING (public.has_marketing_access(auth.uid())) WITH CHECK (public.has_marketing_access(auth.uid()));
CREATE POLICY "Marketing access can delete posts" ON public.marketing_posts
  FOR DELETE TO authenticated USING (public.has_marketing_access(auth.uid()));

-- marketing_post_snapshots
DROP POLICY IF EXISTS "Authenticated can view post snapshots" ON public.marketing_post_snapshots;
DROP POLICY IF EXISTS "Authenticated can insert post snapshots" ON public.marketing_post_snapshots;
CREATE POLICY "Marketing access can view post snapshots" ON public.marketing_post_snapshots
  FOR SELECT TO authenticated USING (public.has_marketing_access(auth.uid()));
CREATE POLICY "Marketing access can insert post snapshots" ON public.marketing_post_snapshots
  FOR INSERT TO authenticated WITH CHECK (public.has_marketing_access(auth.uid()));

-- marketing_ideas
DROP POLICY IF EXISTS "Authenticated can view marketing_ideas" ON public.marketing_ideas;
DROP POLICY IF EXISTS "Authenticated can insert marketing_ideas" ON public.marketing_ideas;
DROP POLICY IF EXISTS "Authenticated can update marketing_ideas" ON public.marketing_ideas;
DROP POLICY IF EXISTS "Authenticated can delete marketing_ideas" ON public.marketing_ideas;
CREATE POLICY "Marketing access can view ideas" ON public.marketing_ideas
  FOR SELECT TO authenticated USING (public.has_marketing_access(auth.uid()));
CREATE POLICY "Marketing access can insert ideas" ON public.marketing_ideas
  FOR INSERT TO authenticated WITH CHECK (public.has_marketing_access(auth.uid()));
CREATE POLICY "Marketing access can update ideas" ON public.marketing_ideas
  FOR UPDATE TO authenticated USING (public.has_marketing_access(auth.uid())) WITH CHECK (public.has_marketing_access(auth.uid()));
CREATE POLICY "Marketing access can delete ideas" ON public.marketing_ideas
  FOR DELETE TO authenticated USING (public.has_marketing_access(auth.uid()));

-- marketing_personas
DROP POLICY IF EXISTS "Authenticated can view marketing_personas" ON public.marketing_personas;
DROP POLICY IF EXISTS "Authenticated can insert marketing_personas" ON public.marketing_personas;
DROP POLICY IF EXISTS "Authenticated can update marketing_personas" ON public.marketing_personas;
DROP POLICY IF EXISTS "Authenticated can delete marketing_personas" ON public.marketing_personas;
CREATE POLICY "Marketing access can view personas" ON public.marketing_personas
  FOR SELECT TO authenticated USING (public.has_marketing_access(auth.uid()));
CREATE POLICY "Marketing access can insert personas" ON public.marketing_personas
  FOR INSERT TO authenticated WITH CHECK (public.has_marketing_access(auth.uid()));
CREATE POLICY "Marketing access can update personas" ON public.marketing_personas
  FOR UPDATE TO authenticated USING (public.has_marketing_access(auth.uid())) WITH CHECK (public.has_marketing_access(auth.uid()));
CREATE POLICY "Marketing access can delete personas" ON public.marketing_personas
  FOR DELETE TO authenticated USING (public.has_marketing_access(auth.uid()));

-- marketing_references
DROP POLICY IF EXISTS "Authenticated can view marketing_references" ON public.marketing_references;
DROP POLICY IF EXISTS "Authenticated can insert marketing_references" ON public.marketing_references;
DROP POLICY IF EXISTS "Authenticated can update marketing_references" ON public.marketing_references;
DROP POLICY IF EXISTS "Authenticated can delete marketing_references" ON public.marketing_references;
CREATE POLICY "Marketing access can view references" ON public.marketing_references
  FOR SELECT TO authenticated USING (public.has_marketing_access(auth.uid()));
CREATE POLICY "Marketing access can insert references" ON public.marketing_references
  FOR INSERT TO authenticated WITH CHECK (public.has_marketing_access(auth.uid()));
CREATE POLICY "Marketing access can update references" ON public.marketing_references
  FOR UPDATE TO authenticated USING (public.has_marketing_access(auth.uid())) WITH CHECK (public.has_marketing_access(auth.uid()));
CREATE POLICY "Marketing access can delete references" ON public.marketing_references
  FOR DELETE TO authenticated USING (public.has_marketing_access(auth.uid()));

-- marketing_account_snapshots
DROP POLICY IF EXISTS "Authenticated can view account snapshots" ON public.marketing_account_snapshots;
DROP POLICY IF EXISTS "Authenticated can insert account snapshots" ON public.marketing_account_snapshots;
CREATE POLICY "Marketing access can view account snapshots" ON public.marketing_account_snapshots
  FOR SELECT TO authenticated USING (public.has_marketing_access(auth.uid()));
CREATE POLICY "Marketing access can insert account snapshots" ON public.marketing_account_snapshots
  FOR INSERT TO authenticated WITH CHECK (public.has_marketing_access(auth.uid()));

-- marketing_account_audience
DROP POLICY IF EXISTS "Authenticated can view audience snapshots" ON public.marketing_account_audience;
DROP POLICY IF EXISTS "Authenticated can insert audience snapshots" ON public.marketing_account_audience;
CREATE POLICY "Marketing access can view account audience" ON public.marketing_account_audience
  FOR SELECT TO authenticated USING (public.has_marketing_access(auth.uid()));
CREATE POLICY "Marketing access can insert account audience" ON public.marketing_account_audience
  FOR INSERT TO authenticated WITH CHECK (public.has_marketing_access(auth.uid()));

-- marketing_ga4_snapshots (mantém service_role para Edge Functions)
DROP POLICY IF EXISTS "Authenticated can view ga4_snapshots" ON public.marketing_ga4_snapshots;
CREATE POLICY "Marketing access can view ga4 snapshots" ON public.marketing_ga4_snapshots
  FOR SELECT TO authenticated USING (public.has_marketing_access(auth.uid()));

-- marketing_ga4_dimensions
DROP POLICY IF EXISTS "Authenticated can view ga4_dimensions" ON public.marketing_ga4_dimensions;
CREATE POLICY "Marketing access can view ga4 dimensions" ON public.marketing_ga4_dimensions
  FOR SELECT TO authenticated USING (public.has_marketing_access(auth.uid()));

-- marketing_report_subscribers
DROP POLICY IF EXISTS "Authenticated can view subscribers" ON public.marketing_report_subscribers;
DROP POLICY IF EXISTS "Authenticated can manage subscribers" ON public.marketing_report_subscribers;
CREATE POLICY "Marketing access can view subscribers" ON public.marketing_report_subscribers
  FOR SELECT TO authenticated USING (public.has_marketing_access(auth.uid()));
CREATE POLICY "Marketing access can manage subscribers" ON public.marketing_report_subscribers
  FOR ALL TO authenticated USING (public.has_marketing_access(auth.uid())) WITH CHECK (public.has_marketing_access(auth.uid()));