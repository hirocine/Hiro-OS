CREATE TABLE public.marketing_report_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_report_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view subscribers" ON public.marketing_report_subscribers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage subscribers" ON public.marketing_report_subscribers
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER update_marketing_report_subscribers_updated_at
  BEFORE UPDATE ON public.marketing_report_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();