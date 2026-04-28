ALTER TABLE public.marketing_posts
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS media_type TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS carousel_media_urls JSONB,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_discovered_at TIMESTAMPTZ;

COMMENT ON COLUMN public.marketing_posts.external_id IS 'ID do post na plataforma original (ex: media id do Instagram)';
COMMENT ON COLUMN public.marketing_posts.source IS 'Origem do post: "manual" (criado pelo usuário) ou "auto_discovered" (importado via API)';
COMMENT ON COLUMN public.marketing_posts.media_type IS 'Tipo de mídia: IMAGE, VIDEO, CAROUSEL_ALBUM (mapeia direto da API do Instagram)';
COMMENT ON COLUMN public.marketing_posts.thumbnail_url IS 'URL da thumbnail (para vídeos/Reels)';
COMMENT ON COLUMN public.marketing_posts.carousel_media_urls IS 'Array de URLs das mídias secundárias em carrosséis. Formato: [{ url, media_type }, ...]';
COMMENT ON COLUMN public.marketing_posts.published_at IS 'Data real de publicação no Instagram (vem da API)';
COMMENT ON COLUMN public.marketing_posts.auto_discovered_at IS 'Quando o post foi auto-descoberto pelo sistema';

CREATE UNIQUE INDEX IF NOT EXISTS idx_marketing_posts_external_id_platform
  ON public.marketing_posts(platform, external_id)
  WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_marketing_posts_published_at
  ON public.marketing_posts(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketing_posts_source
  ON public.marketing_posts(source);