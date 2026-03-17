-- Recalcular contribution_margin_pct para todos os snapshots
UPDATE public.financial_snapshots
SET contribution_margin_pct = CASE
  WHEN COALESCE(revenue, 0) > 0 THEN ROUND((COALESCE(contribution_margin_value, 0) / revenue) * 100, 2)
  ELSE 0
END;