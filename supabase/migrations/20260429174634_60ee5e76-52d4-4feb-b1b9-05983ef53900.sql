-- ============================================================
-- BLOCO 1 — Tabelas de agregação
-- ============================================================

CREATE TABLE IF NOT EXISTS public.marketing_post_metrics_weekly (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.marketing_posts(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  reach INTEGER NOT NULL DEFAULT 0,
  views_delta INTEGER NOT NULL DEFAULT 0,
  likes_delta INTEGER NOT NULL DEFAULT 0,
  reach_delta INTEGER NOT NULL DEFAULT 0,
  source TEXT,
  aggregated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, week_start)
);

CREATE TABLE IF NOT EXISTS public.marketing_post_metrics_monthly (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.marketing_posts(id) ON DELETE CASCADE,
  month_start DATE NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  reach INTEGER NOT NULL DEFAULT 0,
  views_delta INTEGER NOT NULL DEFAULT 0,
  likes_delta INTEGER NOT NULL DEFAULT 0,
  reach_delta INTEGER NOT NULL DEFAULT 0,
  source TEXT,
  aggregated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, month_start)
);

CREATE TABLE IF NOT EXISTS public.marketing_ga4_metrics_monthly (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id TEXT NOT NULL,
  month_start DATE NOT NULL,
  sessions INTEGER NOT NULL DEFAULT 0,
  total_users INTEGER NOT NULL DEFAULT 0,
  new_users INTEGER NOT NULL DEFAULT 0,
  page_views INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  avg_session_duration NUMERIC,
  bounce_rate NUMERIC,
  engagement_rate NUMERIC,
  aggregated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, month_start)
);

CREATE INDEX IF NOT EXISTS idx_post_weekly_week_start ON public.marketing_post_metrics_weekly(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_post_weekly_post_id ON public.marketing_post_metrics_weekly(post_id);
CREATE INDEX IF NOT EXISTS idx_post_monthly_month_start ON public.marketing_post_metrics_monthly(month_start DESC);
CREATE INDEX IF NOT EXISTS idx_post_monthly_post_id ON public.marketing_post_metrics_monthly(post_id);
CREATE INDEX IF NOT EXISTS idx_ga4_monthly_month_start ON public.marketing_ga4_metrics_monthly(month_start DESC);

ALTER TABLE public.marketing_post_metrics_weekly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_post_metrics_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_ga4_metrics_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Marketing access can view post weekly" ON public.marketing_post_metrics_weekly
  FOR SELECT TO authenticated USING (public.has_marketing_access(auth.uid()));
CREATE POLICY "Service role can manage post weekly" ON public.marketing_post_metrics_weekly
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Marketing access can view post monthly" ON public.marketing_post_metrics_monthly
  FOR SELECT TO authenticated USING (public.has_marketing_access(auth.uid()));
CREATE POLICY "Service role can manage post monthly" ON public.marketing_post_metrics_monthly
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Marketing access can view ga4 monthly" ON public.marketing_ga4_metrics_monthly
  FOR SELECT TO authenticated USING (public.has_marketing_access(auth.uid()));
CREATE POLICY "Service role can manage ga4 monthly" ON public.marketing_ga4_metrics_monthly
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.marketing_post_metrics_weekly IS 'Agregado semanal: 1 linha por post por semana. Preenchido a partir de marketing_post_snapshots > 90 dias antes do hard-delete.';
COMMENT ON TABLE public.marketing_post_metrics_monthly IS 'Agregado mensal: 1 linha por post por mês. Preenchido a partir de marketing_post_metrics_weekly > 1 ano antes do hard-delete.';
COMMENT ON TABLE public.marketing_ga4_metrics_monthly IS 'Agregado mensal GA4. Preenchido a partir de marketing_ga4_snapshots > 365 dias.';

-- ============================================================
-- BLOCO 2 — Funções de agregação
-- ============================================================

CREATE OR REPLACE FUNCTION public.aggregate_post_snapshots_to_weekly()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff TIMESTAMPTZ := now() - INTERVAL '90 days';
  rows_aggregated INT;
BEGIN
  INSERT INTO public.marketing_post_metrics_weekly (
    post_id, week_start,
    views, likes, comments, shares, saves, reach,
    views_delta, likes_delta, reach_delta,
    source, aggregated_at
  )
  SELECT
    s.post_id,
    DATE_TRUNC('week', s.captured_at)::DATE AS week_start,
    (ARRAY_AGG(s.views ORDER BY s.captured_at DESC))[1],
    (ARRAY_AGG(s.likes ORDER BY s.captured_at DESC))[1],
    (ARRAY_AGG(s.comments ORDER BY s.captured_at DESC))[1],
    (ARRAY_AGG(s.shares ORDER BY s.captured_at DESC))[1],
    (ARRAY_AGG(s.saves ORDER BY s.captured_at DESC))[1],
    (ARRAY_AGG(s.reach ORDER BY s.captured_at DESC))[1],
    (ARRAY_AGG(s.views ORDER BY s.captured_at DESC))[1] - (ARRAY_AGG(s.views ORDER BY s.captured_at ASC))[1],
    (ARRAY_AGG(s.likes ORDER BY s.captured_at DESC))[1] - (ARRAY_AGG(s.likes ORDER BY s.captured_at ASC))[1],
    (ARRAY_AGG(s.reach ORDER BY s.captured_at DESC))[1] - (ARRAY_AGG(s.reach ORDER BY s.captured_at ASC))[1],
    (ARRAY_AGG(s.source ORDER BY s.captured_at DESC))[1],
    now()
  FROM public.marketing_post_snapshots s
  WHERE s.captured_at < cutoff
  GROUP BY s.post_id, DATE_TRUNC('week', s.captured_at)
  ON CONFLICT (post_id, week_start) DO UPDATE SET
    views = EXCLUDED.views,
    likes = EXCLUDED.likes,
    comments = EXCLUDED.comments,
    shares = EXCLUDED.shares,
    saves = EXCLUDED.saves,
    reach = EXCLUDED.reach,
    views_delta = EXCLUDED.views_delta,
    likes_delta = EXCLUDED.likes_delta,
    reach_delta = EXCLUDED.reach_delta,
    source = EXCLUDED.source,
    aggregated_at = now();

  GET DIAGNOSTICS rows_aggregated = ROW_COUNT;

  DELETE FROM public.marketing_post_snapshots WHERE captured_at < cutoff;

  RAISE NOTICE 'aggregate_post_snapshots_to_weekly: % weeks aggregated', rows_aggregated;
END;
$$;

COMMENT ON FUNCTION public.aggregate_post_snapshots_to_weekly IS 'Agrega marketing_post_snapshots > 90 dias em weekly e deleta os brutos. Roda diariamente.';

CREATE OR REPLACE FUNCTION public.aggregate_post_weekly_to_monthly()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff DATE := (now() - INTERVAL '365 days')::DATE;
  rows_aggregated INT;
BEGIN
  INSERT INTO public.marketing_post_metrics_monthly (
    post_id, month_start,
    views, likes, comments, shares, saves, reach,
    views_delta, likes_delta, reach_delta,
    source, aggregated_at
  )
  SELECT
    w.post_id,
    DATE_TRUNC('month', w.week_start)::DATE AS month_start,
    (ARRAY_AGG(w.views ORDER BY w.week_start DESC))[1],
    (ARRAY_AGG(w.likes ORDER BY w.week_start DESC))[1],
    (ARRAY_AGG(w.comments ORDER BY w.week_start DESC))[1],
    (ARRAY_AGG(w.shares ORDER BY w.week_start DESC))[1],
    (ARRAY_AGG(w.saves ORDER BY w.week_start DESC))[1],
    (ARRAY_AGG(w.reach ORDER BY w.week_start DESC))[1],
    SUM(w.views_delta)::INT,
    SUM(w.likes_delta)::INT,
    SUM(w.reach_delta)::INT,
    (ARRAY_AGG(w.source ORDER BY w.week_start DESC))[1],
    now()
  FROM public.marketing_post_metrics_weekly w
  WHERE w.week_start < cutoff
  GROUP BY w.post_id, DATE_TRUNC('month', w.week_start)
  ON CONFLICT (post_id, month_start) DO UPDATE SET
    views = EXCLUDED.views,
    likes = EXCLUDED.likes,
    comments = EXCLUDED.comments,
    shares = EXCLUDED.shares,
    saves = EXCLUDED.saves,
    reach = EXCLUDED.reach,
    views_delta = EXCLUDED.views_delta,
    likes_delta = EXCLUDED.likes_delta,
    reach_delta = EXCLUDED.reach_delta,
    source = EXCLUDED.source,
    aggregated_at = now();

  GET DIAGNOSTICS rows_aggregated = ROW_COUNT;

  DELETE FROM public.marketing_post_metrics_weekly WHERE week_start < cutoff;

  RAISE NOTICE 'aggregate_post_weekly_to_monthly: % months aggregated', rows_aggregated;
END;
$$;

COMMENT ON FUNCTION public.aggregate_post_weekly_to_monthly IS 'Agrega marketing_post_metrics_weekly > 1 ano em monthly e deleta as semanais. Roda mensalmente.';

CREATE OR REPLACE FUNCTION public.aggregate_ga4_snapshots_to_monthly()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff DATE := (now() - INTERVAL '365 days')::DATE;
  rows_aggregated INT;
BEGIN
  INSERT INTO public.marketing_ga4_metrics_monthly (
    property_id, month_start,
    sessions, total_users, new_users, page_views, conversions,
    avg_session_duration, bounce_rate, engagement_rate,
    aggregated_at
  )
  SELECT
    s.property_id,
    DATE_TRUNC('month', s.captured_date)::DATE AS month_start,
    SUM(COALESCE(s.sessions, 0))::INT,
    SUM(COALESCE(s.total_users, 0))::INT,
    SUM(COALESCE(s.new_users, 0))::INT,
    SUM(COALESCE(s.page_views, 0))::INT,
    SUM(COALESCE(s.conversions, 0))::INT,
    AVG(s.avg_session_duration)::NUMERIC,
    AVG(s.bounce_rate)::NUMERIC,
    AVG(s.engagement_rate)::NUMERIC,
    now()
  FROM public.marketing_ga4_snapshots s
  WHERE s.captured_date < cutoff
  GROUP BY s.property_id, DATE_TRUNC('month', s.captured_date)
  ON CONFLICT (property_id, month_start) DO UPDATE SET
    sessions = EXCLUDED.sessions,
    total_users = EXCLUDED.total_users,
    new_users = EXCLUDED.new_users,
    page_views = EXCLUDED.page_views,
    conversions = EXCLUDED.conversions,
    avg_session_duration = EXCLUDED.avg_session_duration,
    bounce_rate = EXCLUDED.bounce_rate,
    engagement_rate = EXCLUDED.engagement_rate,
    aggregated_at = now();

  GET DIAGNOSTICS rows_aggregated = ROW_COUNT;

  DELETE FROM public.marketing_ga4_snapshots WHERE captured_date < cutoff;

  RAISE NOTICE 'aggregate_ga4_snapshots_to_monthly: % months aggregated', rows_aggregated;
END;
$$;

COMMENT ON FUNCTION public.aggregate_ga4_snapshots_to_monthly IS 'Agrega marketing_ga4_snapshots > 365 dias em monthly e deleta os brutos. Roda mensalmente.';

-- ============================================================
-- BLOCO 3 — Cron jobs
-- ============================================================

DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-old-post-snapshots');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'aggregate-post-snapshots-weekly',
  '15 3 * * *',
  $$ SELECT public.aggregate_post_snapshots_to_weekly(); $$
);

SELECT cron.schedule(
  'aggregate-post-weekly-monthly',
  '30 3 1 * *',
  $$ SELECT public.aggregate_post_weekly_to_monthly(); $$
);

SELECT cron.schedule(
  'aggregate-ga4-snapshots-monthly',
  '45 3 1 * *',
  $$ SELECT public.aggregate_ga4_snapshots_to_monthly(); $$
);

-- ============================================================
-- BLOCO 4 — Views unificadas
-- ============================================================

CREATE OR REPLACE VIEW public.marketing_post_metrics_history AS
SELECT
  post_id,
  captured_at AS period_start,
  'daily'::TEXT AS granularity,
  views, likes, comments, shares, saves, reach,
  source
FROM public.marketing_post_snapshots
UNION ALL
SELECT
  post_id,
  week_start::TIMESTAMPTZ AS period_start,
  'weekly'::TEXT AS granularity,
  views, likes, comments, shares, saves, reach,
  source
FROM public.marketing_post_metrics_weekly
UNION ALL
SELECT
  post_id,
  month_start::TIMESTAMPTZ AS period_start,
  'monthly'::TEXT AS granularity,
  views, likes, comments, shares, saves, reach,
  source
FROM public.marketing_post_metrics_monthly;

COMMENT ON VIEW public.marketing_post_metrics_history IS 'Histórico unificado de métricas de posts. Combina daily (90d) + weekly (1 ano) + monthly (eterno).';

CREATE OR REPLACE VIEW public.marketing_ga4_history AS
SELECT
  property_id,
  captured_date AS period_start,
  'daily'::TEXT AS granularity,
  sessions, total_users, new_users, page_views, conversions,
  avg_session_duration, bounce_rate, engagement_rate
FROM public.marketing_ga4_snapshots
UNION ALL
SELECT
  property_id,
  month_start AS period_start,
  'monthly'::TEXT AS granularity,
  sessions, total_users, new_users, page_views, conversions,
  avg_session_duration, bounce_rate, engagement_rate
FROM public.marketing_ga4_metrics_monthly;

COMMENT ON VIEW public.marketing_ga4_history IS 'Histórico unificado GA4. Combina daily (365d) + monthly (eterno).';

-- ============================================================
-- BLOCO 5 — Agregação inicial manual
-- ============================================================

SELECT public.aggregate_post_snapshots_to_weekly();
SELECT public.aggregate_post_weekly_to_monthly();
SELECT public.aggregate_ga4_snapshots_to_monthly();