-- Inserir metas anuais
INSERT INTO financial_goals (year, revenue_goal)
VALUES (2025, 2000000), (2026, 2000000)
ON CONFLICT (year) DO UPDATE SET revenue_goal = EXCLUDED.revenue_goal, updated_at = now();

-- Atualizar snapshots existentes com revenue_goal calculado
UPDATE financial_snapshots fs
SET revenue_goal = ROUND(fg.revenue_goal / 12, 2)
FROM financial_goals fg
WHERE fs.year = fg.year AND (fs.revenue_goal IS NULL OR fs.revenue_goal = 0);