
CREATE OR REPLACE FUNCTION public.auto_fill_contribution_margin_pct()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF COALESCE(NEW.revenue, 0) > 0 THEN
    NEW.contribution_margin_pct := ROUND((COALESCE(NEW.contribution_margin_value, 0) / NEW.revenue) * 100, 2);
  ELSE
    NEW.contribution_margin_pct := 0;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_fill_contribution_margin_pct
  BEFORE INSERT OR UPDATE OF revenue, contribution_margin_value
  ON public.financial_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_fill_contribution_margin_pct();

-- Atualizar dados existentes
UPDATE public.financial_snapshots
SET contribution_margin_pct = CASE
  WHEN COALESCE(revenue, 0) > 0 THEN ROUND((COALESCE(contribution_margin_value, 0) / revenue) * 100, 2)
  ELSE 0
END;
