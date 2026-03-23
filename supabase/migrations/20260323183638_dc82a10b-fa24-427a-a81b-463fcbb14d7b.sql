
-- Rewrite the function to avoid the UPDATE-on-same-table issue
-- by deferring the recalculation to a statement-level trigger
CREATE OR REPLACE FUNCTION public.recalc_cumulative_cash_flow()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r RECORD;
  running_total numeric := 0;
BEGIN
  -- Skip if called recursively
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Use a loop to update row-by-row in order, avoiding the bulk UPDATE
  -- that conflicts with PostgREST's single-row PATCH
  FOR r IN
    SELECT id, COALESCE(net_cash_flow, 0) AS ncf
    FROM public.financial_snapshots
    ORDER BY year, month
  LOOP
    running_total := running_total + r.ncf;
    UPDATE public.financial_snapshots
    SET cumulative_cash_flow = running_total
    WHERE id = r.id
      AND cumulative_cash_flow IS DISTINCT FROM running_total;
  END LOOP;

  RETURN NEW;
END;
$function$;

-- Re-enable the trigger
ALTER TABLE public.financial_snapshots ENABLE TRIGGER trg_90_recalc_cumulative_cash_flow;
