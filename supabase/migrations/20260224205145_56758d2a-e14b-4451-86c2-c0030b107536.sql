
-- Trigger function: auto-fill revenue_goal on financial_snapshots from financial_goals
CREATE OR REPLACE FUNCTION public.auto_fill_snapshot_revenue_goal()
RETURNS TRIGGER AS $$
DECLARE
  annual_goal numeric;
BEGIN
  SELECT revenue_goal INTO annual_goal
  FROM public.financial_goals
  WHERE year = NEW.year;

  IF annual_goal IS NOT NULL AND annual_goal > 0 THEN
    NEW.revenue_goal := ROUND(annual_goal / 12, 2);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger on INSERT (and UPDATE if year changes)
DROP TRIGGER IF EXISTS trg_auto_fill_revenue_goal ON public.financial_snapshots;
CREATE TRIGGER trg_auto_fill_revenue_goal
BEFORE INSERT OR UPDATE ON public.financial_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.auto_fill_snapshot_revenue_goal();
