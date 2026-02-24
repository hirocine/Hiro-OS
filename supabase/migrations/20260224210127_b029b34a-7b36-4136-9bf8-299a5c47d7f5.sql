UPDATE financial_snapshots fs
SET revenue_goal = ROUND(fg.revenue_goal / 12, 2)
FROM financial_goals fg
WHERE fs.year = fg.year AND fs.revenue_goal = 0;