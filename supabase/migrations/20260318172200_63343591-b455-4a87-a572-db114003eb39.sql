
-- 1. Add cumulative_cash_flow column
ALTER TABLE public.financial_snapshots
ADD COLUMN cumulative_cash_flow numeric DEFAULT 0;

-- 2. Create function to recalculate cumulative_cash_flow for all rows of the same year and beyond
CREATE OR REPLACE FUNCTION public.recalc_cumulative_cash_flow()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Recalculate cumulative_cash_flow for all snapshots
  WITH running AS (
    SELECT id,
           SUM(COALESCE(net_cash_flow, 0)) OVER (
             ORDER BY year, month
             ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
           ) AS cumul
    FROM public.financial_snapshots
  )
  UPDATE public.financial_snapshots fs
  SET cumulative_cash_flow = running.cumul
  FROM running
  WHERE fs.id = running.id
    AND fs.cumulative_cash_flow IS DISTINCT FROM running.cumul;

  RETURN NEW;
END;
$$;

-- 3. Create trigger (runs after insert or update on net_cash_flow)
CREATE TRIGGER trg_90_recalc_cumulative_cash_flow
AFTER INSERT OR UPDATE OF net_cash_flow ON public.financial_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.recalc_cumulative_cash_flow();

-- 4. Backfill existing data
WITH running AS (
  SELECT id,
         SUM(COALESCE(net_cash_flow, 0)) OVER (
           ORDER BY year, month
           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
         ) AS cumul
  FROM public.financial_snapshots
)
UPDATE public.financial_snapshots fs
SET cumulative_cash_flow = running.cumul
FROM running
WHERE fs.id = running.id;
