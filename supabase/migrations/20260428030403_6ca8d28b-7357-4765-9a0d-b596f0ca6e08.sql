-- Snapshot diário de métricas da conta
CREATE TABLE public.marketing_account_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL DEFAULT 'instagram',
  account_id TEXT NOT NULL,
  followers_count INTEGER NOT NULL DEFAULT 0,
  follows_count INTEGER NOT NULL DEFAULT 0,
  media_count INTEGER NOT NULL DEFAULT 0,
  reach_day INTEGER NOT NULL DEFAULT 0,
  views_day INTEGER NOT NULL DEFAULT 0,
  profile_views_day INTEGER NOT NULL DEFAULT 0,
  followers_delta INTEGER,
  raw_response JSONB,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  captured_date DATE GENERATED ALWAYS AS ((captured_at AT TIME ZONE 'UTC')::date) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_account_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view account snapshots"
  ON public.marketing_account_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert account snapshots"
  ON public.marketing_account_snapshots FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_marketing_account_snapshots_captured ON public.marketing_account_snapshots(captured_at DESC);
CREATE INDEX idx_marketing_account_snapshots_platform ON public.marketing_account_snapshots(platform);
CREATE UNIQUE INDEX idx_marketing_account_snapshots_unique_day
  ON public.marketing_account_snapshots(platform, account_id, captured_date);

-- Snapshot semanal de demografia da audiência
CREATE TABLE public.marketing_account_audience (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL DEFAULT 'instagram',
  account_id TEXT NOT NULL,
  gender_age JSONB DEFAULT '{}'::jsonb,
  cities JSONB DEFAULT '{}'::jsonb,
  countries JSONB DEFAULT '{}'::jsonb,
  locales JSONB DEFAULT '{}'::jsonb,
  raw_response JSONB,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_account_audience ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view audience snapshots"
  ON public.marketing_account_audience FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert audience snapshots"
  ON public.marketing_account_audience FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_marketing_account_audience_captured ON public.marketing_account_audience(captured_at DESC);