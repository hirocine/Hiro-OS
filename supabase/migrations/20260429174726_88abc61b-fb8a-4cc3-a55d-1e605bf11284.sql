DROP VIEW IF EXISTS public.marketing_post_metrics_history;
DROP VIEW IF EXISTS public.marketing_ga4_history;

CREATE VIEW public.marketing_post_metrics_history
WITH (security_invoker = true) AS
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

CREATE VIEW public.marketing_ga4_history
WITH (security_invoker = true) AS
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

COMMENT ON VIEW public.marketing_post_metrics_history IS 'Histórico unificado de métricas de posts. Combina daily (90d) + weekly (1 ano) + monthly (eterno). security_invoker para respeitar RLS do usuário.';
COMMENT ON VIEW public.marketing_ga4_history IS 'Histórico unificado GA4. Combina daily (365d) + monthly (eterno). security_invoker para respeitar RLS do usuário.';