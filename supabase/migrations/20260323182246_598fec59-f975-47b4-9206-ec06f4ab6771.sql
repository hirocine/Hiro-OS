
CREATE OR REPLACE FUNCTION public.recalc_cumulative_cash_flow()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Prevent recursive calls: only run at depth 1 (direct trigger)
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

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
$function$;
