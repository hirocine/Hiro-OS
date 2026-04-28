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

export function useMarketingAccountSnapshots(daysBack = 30) {
  const [snapshots, setSnapshots] = useState<AccountSnapshot[]>([]);
  const [audience, setAudience] = useState<AccountAudience | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

    const { data: snapshotsData } = await supabase
      .from('marketing_account_snapshots')
      .select('*')
      .gte('captured_at', since)
      .order('captured_at', { ascending: true });

    const { data: audienceData } = await supabase
      .from('marketing_account_audience')
      .select('*')
      .order('captured_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setSnapshots((snapshotsData ?? []) as AccountSnapshot[]);
    setAudience((audienceData ?? null) as AccountAudience | null);
    setLoading(false);
  }, [daysBack]);

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
