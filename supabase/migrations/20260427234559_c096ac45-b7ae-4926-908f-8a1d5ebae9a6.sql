CREATE TABLE public.marketing_post_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.marketing_posts(id) ON DELETE CASCADE,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  reach INTEGER NOT NULL DEFAULT 0,
  profile_clicks INTEGER NOT NULL DEFAULT 0,
  new_followers INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_post_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view post snapshots" ON public.marketing_post_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert post snapshots" ON public.marketing_post_snapshots FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX idx_marketing_post_snapshots_post_id ON public.marketing_post_snapshots(post_id);
CREATE INDEX idx_marketing_post_snapshots_captured_at ON public.marketing_post_snapshots(captured_at);

CREATE OR REPLACE FUNCTION public.create_post_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.views, NEW.likes, NEW.comments, NEW.shares, NEW.saves, NEW.reach, NEW.profile_clicks, NEW.new_followers)
     IS DISTINCT FROM
     (OLD.views, OLD.likes, OLD.comments, OLD.shares, OLD.saves, OLD.reach, OLD.profile_clicks, OLD.new_followers) THEN
    INSERT INTO public.marketing_post_snapshots (
      post_id, views, likes, comments, shares, saves, reach, profile_clicks, new_followers, source, captured_at
    ) VALUES (
      NEW.id, NEW.views, NEW.likes, NEW.comments, NEW.shares, NEW.saves, NEW.reach,
      NEW.profile_clicks, NEW.new_followers,
      COALESCE(NEW.metrics_source, 'manual'),
      COALESCE(NEW.metrics_updated_at, now())
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER marketing_posts_snapshot_trigger
  AFTER UPDATE ON public.marketing_posts
  FOR EACH ROW EXECUTE FUNCTION public.create_post_snapshot();