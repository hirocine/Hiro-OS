
-- Função para calcular net_cash_flow automaticamente
CREATE OR REPLACE FUNCTION public.auto_fill_net_cash_flow()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.net_cash_flow := COALESCE(NEW.realized_income, 0) - COALESCE(NEW.realized_expenses, 0);
  RETURN NEW;
END;
$$;

-- Trigger
DROP TRIGGER IF EXISTS trg_auto_fill_net_cash_flow ON public.financial_snapshots;
CREATE TRIGGER trg_auto_fill_net_cash_flow
  BEFORE INSERT OR UPDATE OF realized_income, realized_expenses
  ON public.financial_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_fill_net_cash_flow();

-- Recalcular dados existentes
UPDATE public.financial_snapshots
SET net_cash_flow = COALESCE(realized_income, 0) - COALESCE(realized_expenses, 0);
