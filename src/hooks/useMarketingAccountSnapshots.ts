import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AccountSnapshot {
  id: string;
  platform: string;
  account_id: string;
  followers_count: number | null;
  follows_count: number | null;
  media_count: number | null;
  reach_day: number;
  views_day: number;
  profile_views_day: number;
  followers_delta: number | null;
  captured_at: string;
}

export interface AccountAudience {
  id: string;
  platform: string;
  gender_age: Record<string, number>;
  cities: Record<string, number>;
  countries: Record<string, number>;
  locales: Record<string, number>;
  captured_at: string;
}

export interface SnapshotsRange {
  /** Data de início (inclusive) — null significa "sem limite inferior" (todo o histórico) */
  start: Date | null;
  /** Data de fim (inclusive) — null significa "até hoje" */
  end: Date | null;
}

export interface UseMarketingAccountSnapshotsOptions {
  /** Se true, também busca dados de audiência (gênero/idade/cidades). Default: true. */
  includeAudience?: boolean;
  /** Limite máximo de snapshots a buscar. Default: 200 (cobre ~6 meses). */
  limit?: number;
}

export function useMarketingAccountSnapshots(
  range: SnapshotsRange = { start: null, end: null },
  options: UseMarketingAccountSnapshotsOptions = {}
) {
  const { includeAudience = true, limit = 200 } = options;
  const [snapshots, setSnapshots] = useState<AccountSnapshot[]>([]);
  const [audience, setAudience] = useState<AccountAudience | null>(null);
  const [loading, setLoading] = useState(true);

  // Estabilizar referência (strings) pra evitar loop infinito caso caller passe novo objeto
  const startKey = range.start ? range.start.toISOString().slice(0, 10) : 'all';
  const endKey = range.end ? range.end.toISOString().slice(0, 10) : 'today';

  const fetchData = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('marketing_account_snapshots')
      .select('*')
      .order('captured_at', { ascending: true });

    if (range.start) {
      query = query.gte('captured_at', range.start.toISOString());
    }
    if (range.end) {
      const endOfDay = new Date(range.end);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.lte('captured_at', endOfDay.toISOString());
    }

    const { data: snapshotsData } = await query;

    const { data: audienceData } = await supabase
      .from('marketing_account_audience')
      .select('*')
      .order('captured_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setSnapshots((snapshotsData ?? []) as AccountSnapshot[]);
    setAudience((audienceData ?? null) as AccountAudience | null);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startKey, endKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const syncNow = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('sync-instagram-account', {});
    if (error) throw error;
    await fetchData();
    return data;
  }, [fetchData]);

  const syncAudience = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('sync-instagram-audience', {});
    if (error) throw error;
    await fetchData();
    return data;
  }, [fetchData]);

  const latest = snapshots[snapshots.length - 1];
  const oldest = snapshots[0];

  return {
    snapshots,
    audience,
    latest,
    oldest,
    loading,
    refresh: fetchData,
    syncNow,
    syncAudience,
  };
}
