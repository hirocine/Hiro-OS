-- First drop all remaining triggers on financial_snapshots that reference computed columns
DROP TRIGGER IF EXISTS trg_10_auto_fill_revenue_goal ON public.financial_snapshots;
DROP TRIGGER IF EXISTS trg_20_auto_fill_net_profit_pct ON public.financial_snapshots;
DROP TRIGGER IF EXISTS trg_30_auto_fill_contribution_margin ON public.financial_snapshots;
DROP TRIGGER IF EXISTS trg_40_calc_net_cash_flow ON public.financial_snapshots;
DROP TRIGGER IF EXISTS trg_50_calc_cumulative_cash_flow ON public.financial_snapshots;
DROP TRIGGER IF EXISTS trg_60_sync_projections_balance ON public.financial_snapshots;
DROP TRIGGER IF EXISTS trg_70_calc_contribution_margin ON public.financial_snapshots;
DROP TRIGGER IF EXISTS trg_80_calc_net_profit ON public.financial_snapshots;
DROP TRIGGER IF EXISTS trg_90_recalc_cumulative_cash_flow ON public.financial_snapshots;
DROP TRIGGER IF EXISTS trg_compute_financial_metrics ON public.financial_snapshots;

-- Drop associated functions
DROP FUNCTION IF EXISTS public.auto_fill_revenue_goal() CASCADE;
DROP FUNCTION IF EXISTS public.auto_fill_net_profit_pct() CASCADE;
DROP FUNCTION IF EXISTS public.auto_fill_contribution_margin() CASCADE;
DROP FUNCTION IF EXISTS public.calc_net_cash_flow() CASCADE;
DROP FUNCTION IF EXISTS public.calc_cumulative_cash_flow() CASCADE;
DROP FUNCTION IF EXISTS public.sync_projections_balance() CASCADE;
DROP FUNCTION IF EXISTS public.calc_contribution_margin() CASCADE;
DROP FUNCTION IF EXISTS public.calc_net_profit() CASCADE;
DROP FUNCTION IF EXISTS public.recalc_cumulative_cash_flow() CASCADE;

-- Now remove the computed columns from financial_snapshots
ALTER TABLE public.financial_snapshots
  DROP COLUMN IF EXISTS contribution_margin_value,
  DROP COLUMN IF EXISTS contribution_margin_pct,
  DROP COLUMN IF EXISTS net_profit_value,
  DROP COLUMN IF EXISTS net_profit_pct,
  DROP COLUMN IF EXISTS net_cash_flow,
  DROP COLUMN IF EXISTS cumulative_cash_flow,
  DROP COLUMN IF EXISTS revenue_goal;