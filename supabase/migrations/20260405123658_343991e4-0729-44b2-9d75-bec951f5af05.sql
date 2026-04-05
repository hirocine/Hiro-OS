
CREATE TABLE public.proposal_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid REFERENCES public.orcamentos(id) ON DELETE CASCADE NOT NULL,
  viewed_at timestamptz DEFAULT now() NOT NULL,
  ip_address text,
  user_agent text,
  device_type text,
  referrer text,
  time_on_page_seconds integer
);

ALTER TABLE public.proposal_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on proposal_views" ON public.proposal_views
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated read on proposal_views" ON public.proposal_views
FOR SELECT USING (auth.role() = 'authenticated');

CREATE INDEX idx_proposal_views_proposal_id ON public.proposal_views(proposal_id);

ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_proposal_views(proposal_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.orcamentos
  SET views_count = COALESCE(views_count, 0) + 1,
      status = CASE WHEN status IN ('sent', 'draft') THEN 'opened' ELSE status END
  WHERE id = proposal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
