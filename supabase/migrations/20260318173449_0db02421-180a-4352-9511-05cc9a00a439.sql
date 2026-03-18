
-- 1. Fix the old function first (still uses old column names)
CREATE OR REPLACE FUNCTION public.auto_fill_net_cash_flow_30d()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.net_cash_flow_30d := COALESCE(NEW.current_balance, 0) + COALESCE(NEW.income_30d, 0) - COALESCE(NEW.expenses_30d, 0);
  RETURN NEW;
END;
$$;

-- 2. Now rename columns
ALTER TABLE public.cash_flow_projections RENAME COLUMN income_30d TO income;
ALTER TABLE public.cash_flow_projections RENAME COLUMN expenses_30d TO expenses;
ALTER TABLE public.cash_flow_projections RENAME COLUMN net_cash_flow_30d TO net_cash_flow;

-- 3. Update the function to use new names
CREATE OR REPLACE FUNCTION public.auto_fill_net_cash_flow_30d()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.net_cash_flow := COALESCE(NEW.current_balance, 0) + COALESCE(NEW.income, 0) - COALESCE(NEW.expenses, 0);
  RETURN NEW;
END;
$$;

-- 4. Backfill
UPDATE public.cash_flow_projections
SET net_cash_flow = COALESCE(current_balance, 0) + COALESCE(income, 0) - COALESCE(expenses, 0);
