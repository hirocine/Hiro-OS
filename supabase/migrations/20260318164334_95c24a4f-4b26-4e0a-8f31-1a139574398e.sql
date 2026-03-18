
CREATE TABLE public.cash_flow_projections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  income_30d numeric DEFAULT 0,
  expenses_30d numeric DEFAULT 0,
  net_cash_flow_30d numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.cash_flow_projections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read cash flow projections"
  ON public.cash_flow_projections
  FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER set_updated_at_cash_flow_projections
  BEFORE UPDATE ON public.cash_flow_projections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.auto_fill_net_cash_flow_30d()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  NEW.net_cash_flow_30d := COALESCE(NEW.income_30d, 0) - COALESCE(NEW.expenses_30d, 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_10_auto_fill_net_cash_flow_30d
  BEFORE INSERT OR UPDATE ON public.cash_flow_projections
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_fill_net_cash_flow_30d();

INSERT INTO public.cash_flow_projections (income_30d, expenses_30d) VALUES (0, 0);
