-- Corrigir year/month invertidos nos snapshots existentes
UPDATE public.financial_snapshots
SET year = month, month = year
WHERE year < 13 AND month > 12;