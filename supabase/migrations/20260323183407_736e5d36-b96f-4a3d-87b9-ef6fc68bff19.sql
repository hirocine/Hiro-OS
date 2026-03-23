
-- Re-enable only the simpler BEFORE trigger
ALTER TABLE public.financial_snapshots ENABLE TRIGGER trg_auto_fill_net_cash_flow;
