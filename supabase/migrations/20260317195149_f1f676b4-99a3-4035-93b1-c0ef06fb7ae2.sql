
-- 1. Atualizar função para incluir refund
CREATE OR REPLACE FUNCTION public.auto_fill_net_profit_value()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $$
BEGIN
  NEW.net_profit_value := COALESCE(NEW.revenue, 0) - COALESCE(NEW.costs, 0) + COALESCE(NEW.refund, 0);
  RETURN NEW;
END;
$$;

-- 2. Recriar trigger para monitorar refund
DROP TRIGGER IF EXISTS trg_30_auto_fill_net_profit_value ON public.financial_snapshots;
CREATE TRIGGER trg_30_auto_fill_net_profit_value
  BEFORE INSERT OR UPDATE OF revenue, costs, refund
  ON public.financial_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_fill_net_profit_value();

-- 3. Recalcular valores existentes
UPDATE public.financial_snapshots
SET net_profit_value = COALESCE(revenue, 0) - COALESCE(costs, 0) + COALESCE(refund, 0);
