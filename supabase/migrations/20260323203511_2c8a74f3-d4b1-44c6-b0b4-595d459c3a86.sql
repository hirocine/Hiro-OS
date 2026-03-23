CREATE OR REPLACE FUNCTION public.compute_financial_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_revenue_goal numeric;
  v_revenue_goal_monthly numeric;
  v_contribution_margin_value numeric;
  v_contribution_margin_pct numeric;
  v_net_profit_value numeric;
  v_net_profit_pct numeric;
  v_net_cash_flow numeric;
  v_running_total numeric := 0;
  r record;
BEGIN
  -- Get annual revenue goal
  SELECT revenue_goal INTO v_revenue_goal
  FROM public.financial_goals
  WHERE year = NEW.year
  LIMIT 1;

  v_revenue_goal_monthly := COALESCE(v_revenue_goal, 0) / 12;

  -- Contribution margin
  v_contribution_margin_value := COALESCE(NEW.revenue, 0) - COALESCE(NEW.costs_projects, 0) + COALESCE(NEW.refund_projects, 0);
  v_contribution_margin_pct := CASE
    WHEN COALESCE(NEW.revenue, 0) > 0 THEN ROUND((v_contribution_margin_value / NEW.revenue) * 100, 2)
    ELSE 0
  END;

  -- Net profit
  v_net_profit_value := COALESCE(NEW.revenue, 0) - COALESCE(NEW.costs, 0) + COALESCE(NEW.refund, 0);
  v_net_profit_pct := CASE
    WHEN COALESCE(NEW.revenue, 0) > 0 THEN ROUND((v_net_profit_value / NEW.revenue) * 100, 2)
    ELSE 0
  END;

  -- Net cash flow
  v_net_cash_flow := COALESCE(NEW.realized_income, 0) - COALESCE(NEW.realized_expenses, 0);

  -- Upsert into financial_computed
  INSERT INTO public.financial_computed (
    snapshot_id, year, month,
    revenue_goal_monthly, contribution_margin_value, contribution_margin_pct,
    net_profit_value, net_profit_pct, net_cash_flow, cumulative_cash_flow,
    updated_at
  ) VALUES (
    NEW.id, NEW.year, NEW.month,
    v_revenue_goal_monthly, v_contribution_margin_value, v_contribution_margin_pct,
    v_net_profit_value, v_net_profit_pct, v_net_cash_flow, 0,
    now()
  )
  ON CONFLICT (snapshot_id) DO UPDATE SET
    revenue_goal_monthly = EXCLUDED.revenue_goal_monthly,
    contribution_margin_value = EXCLUDED.contribution_margin_value,
    contribution_margin_pct = EXCLUDED.contribution_margin_pct,
    net_profit_value = EXCLUDED.net_profit_value,
    net_profit_pct = EXCLUDED.net_profit_pct,
    net_cash_flow = EXCLUDED.net_cash_flow,
    updated_at = now();

  -- Recalculate cumulative cash flow across ALL months (cross-year)
  v_running_total := 0;
  FOR r IN
    SELECT id, net_cash_flow
    FROM public.financial_computed
    ORDER BY year ASC, month ASC
  LOOP
    v_running_total := v_running_total + COALESCE(r.net_cash_flow, 0);
    UPDATE public.financial_computed
    SET cumulative_cash_flow = v_running_total
    WHERE id = r.id;
  END LOOP;

  -- Sync current balance to cash_flow_projections
  UPDATE public.cash_flow_projections
  SET current_balance = v_running_total,
      updated_at = now()
  WHERE id IN (30, 90);

  RETURN NEW;
END;
$$;