ALTER TABLE public.marketing_posts
  DROP COLUMN IF EXISTS utm_url,
  DROP COLUMN IF EXISTS utm_source,
  DROP COLUMN IF EXISTS utm_medium,
  DROP COLUMN IF EXISTS utm_campaign,
  DROP COLUMN IF EXISTS utm_content,
  DROP COLUMN IF EXISTS destination_url;