import { useMemo } from 'react';
import { useMarketingPosts, type MarketingPost } from './useMarketingPosts';
import { useMarketingPillars, type MarketingPillar } from './useMarketingPillars';

export interface PostWithMetrics extends MarketingPost {
  pillar?: MarketingPillar;
}

export function useMarketingPostMetrics() {
  const { posts, loading: loadingPosts } = useMarketingPosts();
  const { pillars, loading: loadingPillars } = useMarketingPillars();

  const publishedPosts = useMemo<PostWithMetrics[]>(
    () =>
      posts
        .filter((p) => p.status === 'publicado')
        .map((p) => ({ ...p, pillar: pillars.find((pl) => pl.id === p.pillar_id) })),
    [posts, pillars]
  );

  return { publishedPosts, pillars, loading: loadingPosts || loadingPillars };
}
