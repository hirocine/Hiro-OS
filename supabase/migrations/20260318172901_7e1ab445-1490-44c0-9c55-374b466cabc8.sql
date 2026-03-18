
-- 1. Add column
ALTER TABLE public.cash_flow_projections
ADD COLUMN current_balance numeric DEFAULT 0;

-- 2. Function to sync current_balance from financial_snapshots
CREATE OR REPLACE FUNCTION public.sync_current_balance_to_projections()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  curr_month int := EXTRACT(MONTH FROM now())::int;
  curr_year int := EXTRACT(YEAR FROM now())::int;
  bal numeric;
BEGIN
  -- Only act if the changed row is current month
  IF NEW.year = curr_year AND NEW.month = curr_month THEN
    bal := COALESCE(NEW.cumulative_cash_flow, 0);
    UPDATE public.cash_flow_projections SET current_balance = bal;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Trigger on financial_snapshots
CREATE TRIGGER trg_95_sync_current_balance
AFTER INSERT OR UPDATE OF cumulative_cash_flow ON public.financial_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.sync_current_balance_to_projections();

-- 4. Backfill with current month value
UPDATE public.cash_flow_projections
SET current_balance = COALESCE((
  SELECT cumulative_cash_flow
  FROM public.financial_snapshots
  WHERE year = EXTRACT(YEAR FROM now())::int
    AND month = EXTRACT(MONTH FROM now())::int
  LIMIT 1
), 0);
