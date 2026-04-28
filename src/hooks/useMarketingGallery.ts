import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MediaTypeFilter = "all" | "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
export type SourceFilter = "all" | "manual" | "auto_discovered";
export type PillarFilter = "all" | "no_pillar" | string;

export interface GalleryPost {
  id: string;
  title: string;
  caption: string | null;
  hashtags: string[];
  platform: string | null;
  format: string | null;
  media_type: string | null;
  status: string;
  published_at: string | null;
  scheduled_at: string | null;
  published_url: string | null;
  cover_url: string | null;
  thumbnail_url: string | null;
  file_url: string | null;
  carousel_media_urls: Array<{ url: string; media_type: string }> | null;
  pillar_id: string | null;
  source: string;
  auto_discovered_at: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  engagement_rate: number | null;
}

export function useMarketingGallery() {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("marketing_posts")
      .select("*")
      .eq("status", "publicado")
      .not("cover_url", "is", null)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(100);

    if (error) {
      console.error("fetchPosts error:", error);
      setPosts([]);
    } else {
      setPosts((data as unknown as GalleryPost[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const discoverNow = useCallback(async () => {
    setDiscovering(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "discover-instagram-posts",
        {},
      );
      if (error) throw error;
      await fetchPosts();
      return data as {
        success: boolean;
        created: number;
        updated: number;
        total: number;
      };
    } finally {
      setDiscovering(false);
    }
  }, [fetchPosts]);

  const updatePillar = useCallback(
    async (postId: string, pillarId: string | null) => {
      const { error } = await supabase
        .from("marketing_posts")
        .update({ pillar_id: pillarId })
        .eq("id", postId);
      if (error) throw error;
      await fetchPosts();
    },
    [fetchPosts],
  );

  return {
    posts,
    loading,
    discovering,
    refresh: fetchPosts,
    discoverNow,
    updatePillar,
  };
}
