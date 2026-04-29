-- ============================================================
-- BLOCO A.1 — Soft-delete: adicionar deleted_at nas 4 tabelas
-- ============================================================
ALTER TABLE public.marketing_pillars  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.marketing_personas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.marketing_ideas    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.marketing_posts    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_marketing_pillars_deleted_at
  ON public.marketing_pillars(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_marketing_personas_deleted_at
  ON public.marketing_personas(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_marketing_ideas_deleted_at
  ON public.marketing_ideas(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_marketing_posts_deleted_at
  ON public.marketing_posts(deleted_at) WHERE deleted_at IS NOT NULL;

COMMENT ON COLUMN public.marketing_pillars.deleted_at  IS 'Soft-delete: NULL = ativo, timestamp = deletado (recuperável por 30 dias)';
COMMENT ON COLUMN public.marketing_personas.deleted_at IS 'Soft-delete: NULL = ativo, timestamp = deletado';
COMMENT ON COLUMN public.marketing_ideas.deleted_at    IS 'Soft-delete: NULL = ativo, timestamp = deletado';
COMMENT ON COLUMN public.marketing_posts.deleted_at    IS 'Soft-delete: NULL = ativo, timestamp = deletado';

-- ============================================================
-- BLOCO A.2 — Cron de hard-delete após 30 dias
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_soft_deleted_marketing()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff TIMESTAMPTZ := now() - INTERVAL '30 days';
BEGIN
  DELETE FROM public.marketing_pillars  WHERE deleted_at IS NOT NULL AND deleted_at < cutoff;
  DELETE FROM public.marketing_personas WHERE deleted_at IS NOT NULL AND deleted_at < cutoff;
  DELETE FROM public.marketing_ideas    WHERE deleted_at IS NOT NULL AND deleted_at < cutoff;
  DELETE FROM public.marketing_posts    WHERE deleted_at IS NOT NULL AND deleted_at < cutoff;
END;
$$;

-- Remover schedule duplicado se existir, então criar
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-soft-deleted-marketing');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'cleanup-soft-deleted-marketing',
  '0 3 * * *',
  $$ SELECT public.cleanup_soft_deleted_marketing(); $$
);

-- ============================================================
-- BLOCO B.1 — Audit log automático em operações destrutivas
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_marketing_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
  v_user_id UUID := auth.uid();
  v_user_email TEXT;
BEGIN
  IF v_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    v_action := 'SOFT_DELETE_' || upper(TG_TABLE_NAME);
  ELSIF TG_OP = 'UPDATE' AND OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
    v_action := 'RESTORE_' || upper(TG_TABLE_NAME);
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'HARD_DELETE_' || upper(TG_TABLE_NAME);
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO public.audit_logs (
    user_id, user_email, action, table_name, record_id, old_values, new_values
  ) VALUES (
    v_user_id,
    v_user_email,
    v_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_marketing_pillars ON public.marketing_pillars;
CREATE TRIGGER trg_audit_marketing_pillars
  AFTER UPDATE OR DELETE ON public.marketing_pillars
  FOR EACH ROW EXECUTE FUNCTION public.log_marketing_audit();

DROP TRIGGER IF EXISTS trg_audit_marketing_personas ON public.marketing_personas;
CREATE TRIGGER trg_audit_marketing_personas
  AFTER UPDATE OR DELETE ON public.marketing_personas
  FOR EACH ROW EXECUTE FUNCTION public.log_marketing_audit();

DROP TRIGGER IF EXISTS trg_audit_marketing_ideas ON public.marketing_ideas;
CREATE TRIGGER trg_audit_marketing_ideas
  AFTER UPDATE OR DELETE ON public.marketing_ideas
  FOR EACH ROW EXECUTE FUNCTION public.log_marketing_audit();

DROP TRIGGER IF EXISTS trg_audit_marketing_posts ON public.marketing_posts;
CREATE TRIGGER trg_audit_marketing_posts
  AFTER UPDATE OR DELETE ON public.marketing_posts
  FOR EACH ROW EXECUTE FUNCTION public.log_marketing_audit();

COMMENT ON FUNCTION public.log_marketing_audit IS 'Registra automaticamente soft-delete, restore e hard-delete em audit_logs';

-- ============================================================
-- BLOCO C — Retenção de 90 dias em marketing_post_snapshots
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_post_snapshots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.marketing_post_snapshots
  WHERE captured_at < now() - INTERVAL '90 days';
END;
$$;

DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-old-post-snapshots');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'cleanup-old-post-snapshots',
  '15 3 * * *',
  $$ SELECT public.cleanup_old_post_snapshots(); $$
);