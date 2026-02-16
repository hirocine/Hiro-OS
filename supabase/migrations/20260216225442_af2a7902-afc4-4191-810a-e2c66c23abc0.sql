
-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Table: financial_snapshots (one row per month, updated intraday by n8n)
CREATE TABLE public.financial_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year int NOT NULL,
  month int NOT NULL,
  revenue numeric NOT NULL DEFAULT 0,
  revenue_goal numeric NOT NULL DEFAULT 0,
  contribution_margin_pct numeric NOT NULL DEFAULT 0,
  contribution_margin_value numeric NOT NULL DEFAULT 0,
  net_profit_pct numeric NOT NULL DEFAULT 0,
  net_profit_value numeric NOT NULL DEFAULT 0,
  avg_ticket numeric NOT NULL DEFAULT 0,
  cac numeric NOT NULL DEFAULT 0,
  ltv numeric NOT NULL DEFAULT 0,
  churn_rate numeric NOT NULL DEFAULT 0,
  burn_rate numeric NOT NULL DEFAULT 0,
  nps numeric NOT NULL DEFAULT 0,
  cash_balance numeric NOT NULL DEFAULT 0,
  realized_income numeric NOT NULL DEFAULT 0,
  realized_expenses numeric NOT NULL DEFAULT 0,
  receivables_30d numeric NOT NULL DEFAULT 0,
  payables_30d numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(year, month)
);

-- Table: financial_goals (one row per year)
CREATE TABLE public.financial_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year int NOT NULL UNIQUE,
  revenue_goal numeric NOT NULL DEFAULT 0,
  margin_goal_pct numeric NOT NULL DEFAULT 0,
  profit_goal_pct numeric NOT NULL DEFAULT 0,
  cac_goal numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

-- RLS: SELECT for authenticated users
CREATE POLICY "Authenticated users can view financial snapshots"
  ON public.financial_snapshots FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view financial goals"
  ON public.financial_goals FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- RLS: INSERT/UPDATE with true (edge function uses service_role to bypass)
CREATE POLICY "Service role can insert financial snapshots"
  ON public.financial_snapshots FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update financial snapshots"
  ON public.financial_snapshots FOR UPDATE
  USING (true);

CREATE POLICY "Service role can insert financial goals"
  ON public.financial_goals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update financial goals"
  ON public.financial_goals FOR UPDATE
  USING (true);

-- Triggers for updated_at
CREATE TRIGGER set_financial_snapshots_updated_at
  BEFORE UPDATE ON public.financial_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_financial_goals_updated_at
  BEFORE UPDATE ON public.financial_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
