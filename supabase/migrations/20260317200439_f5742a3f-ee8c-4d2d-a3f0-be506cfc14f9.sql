-- Recalcular revenue_goal para todos os snapshots existentes
-- usando o valor da tabela financial_goals dividido por 12
UPDATE public.financial_snapshots fs
SET revenue_goal = ROUND(fg.revenue_goal / 12, 2)
FROM public.financial_goals fg
WHERE fg.year = fs.year
  AND fg.revenue_goal IS NOT NULL
  AND fg.revenue_goal > 0;