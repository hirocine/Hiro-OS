ALTER TABLE public.marketing_ga4_dimensions
  ADD COLUMN IF NOT EXISTS exit_pages JSONB,
  ADD COLUMN IF NOT EXISTS conversion_events JSONB;

COMMENT ON COLUMN public.marketing_ga4_dimensions.exit_pages IS 'Top páginas onde usuários saíram: [{path, exits, views, exit_rate}]';
COMMENT ON COLUMN public.marketing_ga4_dimensions.conversion_events IS 'Eventos de conversão (clicks WhatsApp, etc): [{event_name, count}]';