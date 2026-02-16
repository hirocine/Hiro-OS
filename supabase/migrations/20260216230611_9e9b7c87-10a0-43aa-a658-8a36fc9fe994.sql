
-- Drop existing overly permissive INSERT/UPDATE policies on financial_snapshots
DROP POLICY IF EXISTS "Allow insert for service role" ON public.financial_snapshots;
DROP POLICY IF EXISTS "Allow update for service role" ON public.financial_snapshots;

-- Drop existing overly permissive INSERT/UPDATE policies on financial_goals
DROP POLICY IF EXISTS "Allow insert for service role" ON public.financial_goals;
DROP POLICY IF EXISTS "Allow update for service role" ON public.financial_goals;
