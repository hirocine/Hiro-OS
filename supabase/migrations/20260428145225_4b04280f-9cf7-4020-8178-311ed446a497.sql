ALTER TABLE public.marketing_account_snapshots
  ALTER COLUMN followers_count DROP NOT NULL,
  ALTER COLUMN follows_count DROP NOT NULL,
  ALTER COLUMN media_count DROP NOT NULL;

UPDATE public.marketing_account_snapshots
SET
  followers_count = NULL,
  follows_count = NULL,
  media_count = NULL,
  followers_delta = NULL
WHERE captured_date < CURRENT_DATE
  AND platform = 'instagram';