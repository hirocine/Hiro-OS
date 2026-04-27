ALTER TABLE public.marketing_posts
  ADD COLUMN views INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN likes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN comments INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN shares INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN saves INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN reach INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN profile_clicks INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN new_followers INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN metrics_updated_at TIMESTAMPTZ,
  ADD COLUMN metrics_source TEXT;

ALTER TABLE public.marketing_posts
  ADD COLUMN engagement_rate NUMERIC GENERATED ALWAYS AS (
    CASE
      WHEN reach > 0 THEN ((likes + comments + shares + saves)::numeric / reach) * 100
      ELSE 0
    END
  ) STORED;