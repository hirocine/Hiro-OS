
-- Fix the net_profit_pct trigger function
CREATE OR REPLACE FUNCTION public.auto_fill_net_profit_pct()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF COALESCE(NEW.revenue, 0) > 0 THEN
    NEW.net_profit_pct := ROUND((COALESCE(NEW.net_profit_value, 0) / NEW.revenue) * 100, 2);
  ELSE
    NEW.net_profit_pct := 0;
  END IF;
  RETURN NEW;
END;
$$;

-- Also fix net_profit_value trigger to ensure correctness
CREATE OR REPLACE FUNCTION public.auto_fill_net_profit_value()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.net_profit_value := COALESCE(NEW.revenue, 0) - COALESCE(NEW.costs, 0);
  RETURN NEW;
END;
$$;

-- Bulk update existing rows
UPDATE public.financial_snapshots
SET 
  net_profit_value = COALESCE(revenue, 0) - COALESCE(costs, 0),
  net_profit_pct = CASE
    WHEN COALESCE(revenue, 0) > 0 THEN ROUND(((COALESCE(revenue, 0) - COALESCE(costs, 0)) / revenue) * 100, 2)
    ELSE 0
  END;
