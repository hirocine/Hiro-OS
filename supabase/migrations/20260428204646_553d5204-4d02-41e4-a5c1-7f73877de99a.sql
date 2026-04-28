CREATE OR REPLACE FUNCTION public.sync_idea_status_from_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.idea_id IS NOT NULL THEN
    UPDATE public.marketing_ideas
       SET status = CASE NEW.status
                      WHEN 'publicado'   THEN 'publicada'::text
                      WHEN 'cancelado'   THEN 'validada'::text
                      WHEN 'agendado'    THEN 'em_producao'::text
                      WHEN 'em_producao' THEN 'em_producao'::text
                      ELSE status::text
                    END,
           updated_at = now()
     WHERE id = NEW.idea_id;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.idea_id IS NOT NULL AND NEW.idea_id IS NULL THEN
    UPDATE public.marketing_ideas
       SET status = 'validada',
           updated_at = now()
     WHERE id = OLD.idea_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_idea_status_from_post ON public.marketing_posts;
CREATE TRIGGER trg_sync_idea_status_from_post
  AFTER INSERT OR UPDATE OF status, idea_id ON public.marketing_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_idea_status_from_post();

CREATE OR REPLACE FUNCTION public.sync_idea_status_on_post_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.idea_id IS NOT NULL THEN
    UPDATE public.marketing_ideas
       SET status = 'validada',
           updated_at = now()
     WHERE id = OLD.idea_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_idea_status_on_post_delete ON public.marketing_posts;
CREATE TRIGGER trg_sync_idea_status_on_post_delete
  BEFORE DELETE ON public.marketing_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_idea_status_on_post_delete();

COMMENT ON FUNCTION public.sync_idea_status_from_post IS 'Sincroniza status da ideia quando o post associado é criado ou atualizado';
COMMENT ON FUNCTION public.sync_idea_status_on_post_delete IS 'Volta ideia para validada quando o post associado é deletado';

CREATE INDEX IF NOT EXISTS idx_marketing_posts_idea_id
  ON public.marketing_posts(idea_id)
  WHERE idea_id IS NOT NULL;