-- Garantir extensões habilitadas (pg_cron e pg_net costumam já estar)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remover job antigo se existir (idempotente)
DO $$
BEGIN
  PERFORM cron.unschedule('sync-ga4-data-daily');
EXCEPTION WHEN OTHERS THEN
  NULL;
END$$;

SELECT cron.schedule(
  'sync-ga4-data-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://oddxoicvreymmeynfxxj.supabase.co/functions/v1/sync-ga4-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kZHhvaWN2cmV5bW1leW5meHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Mjg0NjIsImV4cCI6MjA2OTMwNDQ2Mn0.IffCg2BlXqEQWI11AmHryk9O4_KngfoWquEkWn5hg_4'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);