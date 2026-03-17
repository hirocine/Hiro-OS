-- 1. Atualizar função para incluir refund_projects
CREATE OR REPLACE FUNCTION public.auto_fill_contribution_margin_value()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $$
BEGIN
  NEW.contribution_margin_value := COALESCE(NEW.revenue, 0) - COALESCE(NEW.costs_projects, 0) + COALESCE(NEW.refund_projects, 0);
  RETURN NEW;
END;
$$;

-- 2. Recriar trigger para monitorar refund_projects
DROP TRIGGER IF EXISTS trg_10_auto_fill_contribution_margin_value ON public.financial_snapshots;
CREATE TRIGGER trg_10_auto_fill_contribution_margin_value
  BEFORE INSERT OR UPDATE OF revenue, costs_projects, refund_projects
  ON public.financial_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_fill_contribution_margin_value();

-- 3. Recalcular valores existentes
UPDATE public.financial_snapshots
SET contribution_margin_value = COALESCE(revenue, 0) - COALESCE(costs_projects, 0) + COALESCE(refund_projects, 0);