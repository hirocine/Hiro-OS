import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PostMetricHistoryEntry {
  post_id: string;
  period_start: string;
  granularity: 'daily' | 'weekly' | 'monthly';
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  source: string | null;
}

/**
 * Busca histórico unificado de métricas de posts.
 * - Períodos curtos (< 90 dias): retorna daily snapshots.
 * - Períodos médios (90 dias - 1 ano): retorna weekly aggregations.
 * - Períodos longos (> 1 ano): retorna monthly aggregations.
 *
 * A view marketing_post_metrics_history combina as 3 fontes automaticamente.
 */
export function useMarketingPostMetricsHistory(
  postIds: string[],
  range: { start: Date | null; end: Date | null }
) {
  const [history, setHistory] = useState<PostMetricHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Stable deps for the effect below.
  const postIdsKey = postIds.join(',');
  const rangeStart = range.start?.toISOString();
  const rangeEnd = range.end?.toISOString();

  useEffect(() => {
    if (postIds.length === 0) {
      setHistory([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let q = supabase
          .from('marketing_post_metrics_history')
          .select('*')
          .in('post_id', postIds);

        if (range.start) q = q.gte('period_start', range.start.toISOString());
        if (range.end) q = q.lte('period_start', range.end.toISOString());

        const { data, error } = await q.order('period_start', { ascending: true });
        if (!cancelled && !error && data) {
          setHistory(data as unknown as PostMetricHistoryEntry[]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // Extract derived values so the linter can statically check deps. We
    // intentionally key on the *contents* of postIds (not the array
    // reference) and on ISO timestamps so a re-render with a new array
    // identity but same data doesn't re-trigger the fetch.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: fetch helper closes over the listed deps; missing deps are stable refs/setters
  }, [postIdsKey, rangeStart, rangeEnd]);

  return { history, loading };
}
