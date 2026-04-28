-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove jobs previamente criados (idempotência)
DO $$
BEGIN
  PERFORM cron.unschedule('sync-instagram-account-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-instagram-account-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('sync-instagram-audience-weekly') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-instagram-audience-weekly');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('auto-sync-instagram-posts-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-sync-instagram-posts-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 1. Sync diário da conta Instagram (8h UTC = 5h BRT)
SELECT cron.schedule(
  'sync-instagram-account-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://oddxoicvreymmeynfxxj.supabase.co/functions/v1/sync-instagram-account',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kZHhvaWN2cmV5bW1leW5meHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Mjg0NjIsImV4cCI6MjA2OTMwNDQ2Mn0.IffCg2BlXqEQWI11AmHryk9O4_KngfoWquEkWn5hg_4'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 2. Sync semanal da audiência (segundas 9h UTC = 6h BRT)
SELECT cron.schedule(
  'sync-instagram-audience-weekly',
  '0 9 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://oddxoicvreymmeynfxxj.supabase.co/functions/v1/sync-instagram-audience',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kZHhvaWN2cmV5bW1leW5meHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Mjg0NjIsImV4cCI6MjA2OTMwNDQ2Mn0.IffCg2BlXqEQWI11AmHryk9O4_KngfoWquEkWn5hg_4'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 3. Sync diário das métricas dos posts (10h UTC = 7h BRT)
SELECT cron.schedule(
  'auto-sync-instagram-posts-daily',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://oddxoicvreymmeynfxxj.supabase.co/functions/v1/auto-sync-instagram-posts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kZHhvaWN2cmV5bW1leW5meHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Mjg0NjIsImV4cCI6MjA2OTMwNDQ2Mn0.IffCg2BlXqEQWI11AmHryk9O4_KngfoWquEkWn5hg_4'
    ),
    body := '{}'::jsonb
  );
  $$
);