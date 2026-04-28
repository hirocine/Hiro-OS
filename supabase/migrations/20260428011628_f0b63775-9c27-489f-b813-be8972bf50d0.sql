CREATE TABLE public.marketing_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL UNIQUE,
  account_id TEXT,
  account_name TEXT,
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  connected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  connected_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'disconnected',
  status_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view marketing_integrations"
  ON public.marketing_integrations
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert marketing_integrations"
  ON public.marketing_integrations
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update marketing_integrations"
  ON public.marketing_integrations
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete marketing_integrations"
  ON public.marketing_integrations
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_marketing_integrations_updated_at
  BEFORE UPDATE ON public.marketing_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();