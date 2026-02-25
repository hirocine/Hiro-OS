
-- 1) Função: auto_fill_net_profit_value
CREATE OR REPLACE FUNCTION public.auto_fill_net_profit_value()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $$
BEGIN
  NEW.net_profit_value := COALESCE(NEW.revenue, 0) - COALESCE(NEW.costs, 0);
  RETURN NEW;
END;
$$;

-- 2) Função: auto_fill_net_profit_pct
CREATE OR REPLACE FUNCTION public.auto_fill_net_profit_pct()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
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

-- 3) Triggers (drop if exist to avoid duplicates)
DROP TRIGGER IF EXISTS trg_auto_fill_net_profit_value ON public.financial_snapshots;
CREATE TRIGGER trg_auto_fill_net_profit_value
  BEFORE INSERT OR UPDATE OF revenue, costs
  ON public.financial_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_fill_net_profit_value();

DROP TRIGGER IF EXISTS trg_auto_fill_net_profit_pct ON public.financial_snapshots;
CREATE TRIGGER trg_auto_fill_net_profit_pct
  BEFORE INSERT OR UPDATE OF revenue, costs, net_profit_value
  ON public.financial_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_fill_net_profit_pct();

-- 4) Bulk update existing rows
UPDATE public.financial_snapshots
SET
  net_profit_value = COALESCE(revenue, 0) - COALESCE(costs, 0),
  net_profit_pct = CASE
    WHEN COALESCE(revenue, 0) > 0 THEN ROUND(((COALESCE(revenue, 0) - COALESCE(costs, 0)) / revenue) * 100, 2)
    ELSE 0
  END;
