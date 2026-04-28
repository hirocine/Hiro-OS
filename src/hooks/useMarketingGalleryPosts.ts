import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { PostStatus } from '@/lib/marketing-posts-config';

export interface GalleryPost {
  id: string;
  title: string;
  caption: string | null;
  hashtags: string[];
  platform: string | null;
  format: string | null;
  status: PostStatus;
  cover_url: string | null;
  thumbnail_url: string | null;
  file_url: string | null;
  published_url: string | null;
  published_at: string | null;
  scheduled_at: string | null;
  pillar_id: string | null;
  source: string;
  external_id: string | null;
  media_type: string | null;
  carousel_media_urls: Array<{ url: string; media_type: string }> | null;
  likes: number;
  comments: number;
  views: number;
  reach: number;
  saves: number;
  shares: number;
  engagement_rate: number | null;
  auto_discovered_at: string | null;
  created_at: string;
}

export function useMarketingGalleryPosts() {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketing_posts')
        .select('*')
        .eq('platform', 'instagram')
        .eq('status', 'publicado')
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(500);
      if (error) throw error;
      setPosts((data || []) as unknown as GalleryPost[]);
    } catch (err) {
      logger.error('Failed to fetch gallery posts', { module: 'marketing', error: err });
      toast.error('Erro ao carregar galeria');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, loading, refetch: fetchPosts };
}
