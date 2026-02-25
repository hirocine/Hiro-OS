CREATE OR REPLACE FUNCTION public.auto_fill_contribution_margin_value()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  NEW.contribution_margin_value := COALESCE(NEW.revenue, 0) - COALESCE(NEW.costs_projects, 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_fill_contribution_margin_value
  BEFORE INSERT OR UPDATE OF revenue, costs_projects
  ON public.financial_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_fill_contribution_margin_value();

UPDATE public.financial_snapshots
SET contribution_margin_value = COALESCE(revenue, 0) - COALESCE(costs_projects, 0);