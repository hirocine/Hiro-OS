-- Drop the old trigger that only fires on net_cash_flow changes
DROP TRIGGER IF EXISTS trg_90_recalc_cumulative_cash_flow ON public.financial_snapshots;

-- Recreate it to also fire when realized_income or realized_expenses change
CREATE TRIGGER trg_90_recalc_cumulative_cash_flow
  AFTER INSERT OR UPDATE OF net_cash_flow, realized_income, realized_expenses
  ON public.financial_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION recalc_cumulative_cash_flow();