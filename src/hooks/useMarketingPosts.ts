import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { PostStatus } from '@/lib/marketing-posts-config';

export interface MarketingPost {
  id: string;
  title: string;
  caption: string | null;
  hashtags: string[];
  platform: string | null;
  format: string | null;
  status: PostStatus;
  scheduled_at: string | null;
  cover_url: string | null;
  file_url: string | null;
  published_url: string | null;
  pillar_id: string | null;
  persona_id: string | null;
  idea_id: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  profile_clicks: number;
  new_followers: number;
  engagement_rate: number | null;
  metrics_updated_at: string | null;
  metrics_source: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type MarketingPostInput = Partial<Omit<MarketingPost, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'engagement_rate'>> & {
  title: string;
};

interface FetchOptions {
  scheduled_from?: string;
  scheduled_to?: string;
}

export function useMarketingPosts(options: FetchOptions = {}) {
  const [posts, setPosts] = useState<MarketingPost[]>([]);
  const [loading, setLoading] = useState(true);

  const { scheduled_from, scheduled_to } = options;

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      let q = supabase.from('marketing_posts').select('*').is('deleted_at', null).order('scheduled_at', { ascending: true });
      if (scheduled_from) q = q.gte('scheduled_at', scheduled_from);
      if (scheduled_to) q = q.lte('scheduled_at', scheduled_to);
      const { data, error } = await q;
      if (error) throw error;
      setPosts((data || []) as MarketingPost[]);
    } catch (err) {
      logger.error('Failed to fetch marketing posts', { module: 'marketing', error: err });
      toast.error('Erro ao carregar posts');
    } finally {
      setLoading(false);
    }
  }, [scheduled_from, scheduled_to]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const createPost = async (input: MarketingPostInput) => {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('marketing_posts')
        .insert({ ...input, created_by: userRes.user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      setPosts((prev) => [...prev, data as MarketingPost]);
      toast.success('Post criado');
      return data as MarketingPost;
    } catch (err) {
      logger.error('Failed to create post', { module: 'marketing', error: err });
      toast.error('Erro ao criar post');
      throw err;
    }
  };

  const updatePost = async (id: string, input: Partial<MarketingPostInput>) => {
    try {
      const { data, error } = await supabase
        .from('marketing_posts')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      setPosts((prev) => prev.map((p) => (p.id === id ? (data as MarketingPost) : p)));
      toast.success('Post atualizado');
      return data as MarketingPost;
    } catch (err) {
      logger.error('Failed to update post', { module: 'marketing', error: err });
      toast.error('Erro ao atualizar post');
      throw err;
    }
  };

  const deletePost = async (id: string) => {
    try {
      const { error } = await supabase.from('marketing_posts').delete().eq('id', id);
      if (error) throw error;
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Post removido');
    } catch (err) {
      logger.error('Failed to delete post', { module: 'marketing', error: err });
      toast.error('Erro ao remover post');
      throw err;
    }
  };

  const uploadCover = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `posts/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from('marketing-assets')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from('marketing-assets').getPublicUrl(path);
    return data.publicUrl;
  };

  return { posts, loading, fetchPosts, createPost, updatePost, deletePost, uploadCover };
}
