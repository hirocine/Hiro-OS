
-- Disable triggers related to realized_income
ALTER TABLE public.financial_snapshots DISABLE TRIGGER trg_auto_fill_net_cash_flow;
ALTER TABLE public.financial_snapshots DISABLE TRIGGER trg_90_recalc_cumulative_cash_flow;
