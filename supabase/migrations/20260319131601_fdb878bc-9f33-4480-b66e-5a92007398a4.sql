-- Recalculate all cumulative_cash_flow values
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