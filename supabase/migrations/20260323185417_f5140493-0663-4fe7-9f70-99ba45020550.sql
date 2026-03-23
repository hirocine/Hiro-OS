
-- 1. Create financial_computed table
CREATE TABLE public.financial_computed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id text NOT NULL UNIQUE,
  year integer NOT NULL,
  month integer NOT NULL,
  revenue_goal_monthly numeric DEFAULT 0,
  contribution_margin_value numeric DEFAULT 0,
  contribution_margin_pct numeric DEFAULT 0,
  net_profit_value numeric DEFAULT 0,
  net_profit_pct numeric DEFAULT 0,
  net_cash_flow numeric DEFAULT 0,
  cumulative_cash_flow numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(year, month)
);

ALTER TABLE public.financial_computed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read financial_computed"
  ON public.financial_computed FOR SELECT
  TO authenticated USING (true);

-- 2. Populate from existing data
INSERT INTO public.financial_computed (
  snapshot_id, year, month,
  revenue_goal_monthly, contribution_margin_value, contribution_margin_pct,
  net_profit_value, net_profit_pct, net_cash_flow, cumulative_cash_flow
)
SELECT
  fs.id, fs.year, fs.month,
  COALESCE(fs.revenue_goal, 0),
  COALESCE(fs.contribution_margin_value, 0),
  COALESCE(fs.contribution_margin_pct, 0),
  COALESCE(fs.net_profit_value, 0),
  COALESCE(fs.net_profit_pct, 0),
  COALESCE(fs.net_cash_flow, 0),
  COALESCE(fs.cumulative_cash_flow, 0)
FROM public.financial_snapshots fs
ORDER BY fs.year, fs.month
ON CONFLICT (snapshot_id) DO NOTHING;

-- 3. Drop ALL triggers on financial_snapshots
DROP TRIGGER IF EXISTS trg_auto_fill_revenue_goal ON public.financial_snapshots;
DROP TRIGGER IF EXISTS trg_auto_fill_contribution_margin_value ON public.financial_snapshots;
DROP TRIGGER IF EXISTS trg_auto_fill_contribution_margin_pct ON public.financial_snapshots;
DROP TRIGGER IF EXISTS trg_auto_fill_net_profit_value ON public.financial_snapshots;
DROP TRIGGER IF EXISTS trg_auto_fill_net_profit_pct ON public.financial_snapshots;
DROP TRIGGER IF EXISTS trg_auto_fill_net_cash_flow ON public.financial_snapshots;
DROP TRIGGER IF EXISTS trg_90_recalc_cumulative_cash_flow ON public.financial_snapshots;
DROP TRIGGER IF EXISTS trg_95_sync_current_balance ON public.financial_snapshots;

-- 4. Create compute function (writes to financial_computed only)
CREATE OR REPLACE FUNCTION public.compute_financial_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_revenue numeric;
  v_costs numeric;
  v_costs_projects numeric;
  v_refund numeric;
  v_refund_projects numeric;
  v_realized_income numeric;
  v_realized_expenses numeric;
  v_net_cash_flow numeric;
  v_cmv numeric;
  v_cmp numeric;
  v_npv numeric;
  v_npp numeric;
  v_rgm numeric;
  v_annual_goal numeric;
  r RECORD;
  running_total numeric := 0;
  v_current_month integer;
BEGIN
  v_revenue := COALESCE(NEW.revenue, 0);
  v_costs := COALESCE(NEW.costs, 0);
  v_costs_projects := COALESCE(NEW.costs_projects, 0);
  v_refund := COALESCE(NEW.refund, 0);
  v_refund_projects := COALESCE(NEW.refund_projects, 0);
  v_realized_income := COALESCE(NEW.realized_income, 0);
  v_realized_expenses := COALESCE(NEW.realized_expenses, 0);

  v_net_cash_flow := v_realized_income - v_realized_expenses;

  v_cmv := v_revenue - v_costs_projects + v_refund_projects;
  v_cmp := CASE WHEN v_revenue > 0 THEN ROUND((v_cmv / v_revenue) * 100, 2) ELSE 0 END;

  v_npv := v_revenue - v_costs + v_refund;
  v_npp := CASE WHEN v_revenue > 0 THEN ROUND((v_npv / v_revenue) * 100, 2) ELSE 0 END;

  SELECT COALESCE(fg.revenue_goal, 0) INTO v_annual_goal
  FROM public.financial_goals fg WHERE fg.year = NEW.year;
  v_rgm := CASE WHEN COALESCE(v_annual_goal, 0) > 0 THEN ROUND(v_annual_goal / 12, 2) ELSE 0 END;

  INSERT INTO public.financial_computed (
    snapshot_id, year, month,
    revenue_goal_monthly, contribution_margin_value, contribution_margin_pct,
    net_profit_value, net_profit_pct, net_cash_flow, cumulative_cash_flow, updated_at
  ) VALUES (
    NEW.id, NEW.year, NEW.month,
    v_rgm, v_cmv, v_cmp, v_npv, v_npp, v_net_cash_flow, 0, now()
  )
  ON CONFLICT (snapshot_id) DO UPDATE SET
    year = EXCLUDED.year, month = EXCLUDED.month,
    revenue_goal_monthly = EXCLUDED.revenue_goal_monthly,
    contribution_margin_value = EXCLUDED.contribution_margin_value,
    contribution_margin_pct = EXCLUDED.contribution_margin_pct,
    net_profit_value = EXCLUDED.net_profit_value,
    net_profit_pct = EXCLUDED.net_profit_pct,
    net_cash_flow = EXCLUDED.net_cash_flow,
    updated_at = now();

  running_total := 0;
  FOR r IN
    SELECT fc.id AS cid, COALESCE(fc.net_cash_flow, 0) AS ncf
    FROM public.financial_computed fc
    ORDER BY fc.year, fc.month
  LOOP
    running_total := running_total + r.ncf;
    UPDATE public.financial_computed
    SET cumulative_cash_flow = running_total
    WHERE id = r.cid AND cumulative_cash_flow IS DISTINCT FROM running_total;
  END LOOP;

  v_current_month := EXTRACT(MONTH FROM now())::integer;
  UPDATE public.cash_flow_projections
  SET current_balance = (
    SELECT fc.cumulative_cash_flow FROM public.financial_computed fc
    WHERE fc.year = EXTRACT(YEAR FROM now())::integer AND fc.month = v_current_month
  ), updated_at = now()
  WHERE id IN (30, 90);

  RETURN NEW;
END;
$$;

-- 5. Create AFTER trigger (reads NEW, writes to financial_computed - no self-referential update)
CREATE TRIGGER trg_compute_financial_metrics
AFTER INSERT OR UPDATE ON public.financial_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.compute_financial_metrics();
