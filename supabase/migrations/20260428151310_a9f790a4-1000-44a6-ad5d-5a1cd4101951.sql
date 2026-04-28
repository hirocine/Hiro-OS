SELECT cron.unschedule('discover-instagram-posts-daily');

SELECT cron.schedule(
  'discover-instagram-posts-daily',
  '30 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://oddxoicvreymmeynfxxj.supabase.co/functions/v1/discover-instagram-posts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kZHhvaWN2cmV5bW1leW5meHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Mjg0NjIsImV4cCI6MjA2OTMwNDQ2Mn0.IffCg2BlXqEQWI11AmHryk9O4_KngfoWquEkWn5hg_4'
    ),
    body := '{}'::jsonb
  );
  $$
);