import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface GA4Snapshot {
  id: string;
  property_id: string;
  captured_date: string;
  sessions: number | null;
  total_users: number | null;
  new_users: number | null;
  page_views: number | null;
  avg_session_duration: number | null;
  bounce_rate: number | null;
  engagement_rate: number | null;
  conversions: number | null;
  top_source: string | null;
  captured_at: string;
}

export interface GA4Dimensions {
  id: string;
  property_id: string;
  captured_date: string;
  sources_breakdown: Record<string, number> | null;
  top_pages: Array<{ path: string; views: number }> | null;
  mediums_breakdown: Record<string, number> | null;
  devices_breakdown: Record<string, number> | null;
  countries_breakdown: Record<string, number> | null;
  exit_pages: Array<{ path: string; exits: number; views: number; exit_rate: number }> | null;
  conversion_events: Array<{ event_name: string; count: number }> | null;
  captured_at: string;
}

export interface GA4Range {
  start: Date | null;
  end: Date | null;
}

export function useMarketingGA4(range: GA4Range = { start: null, end: null }) {
  const [snapshots, setSnapshots] = useState<GA4Snapshot[]>([]);
  const [dimensions, setDimensions] = useState<GA4Dimensions | null>(null);
  const [loading, setLoading] = useState(true);

  const startKey = range.start?.toISOString().slice(0, 10) ?? '';
  const endKey = range.end?.toISOString().slice(0, 10) ?? '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let snapsQ = supabase
        .from('marketing_ga4_snapshots')
        .select('*')
        .order('captured_date', { ascending: true });

      if (startKey) snapsQ = snapsQ.gte('captured_date', startKey);
      if (endKey) snapsQ = snapsQ.lte('captured_date', endKey);

      const [{ data: snaps, error: snapsErr }, { data: dims, error: dimsErr }] = await Promise.all([
        snapsQ,
        supabase
          .from('marketing_ga4_dimensions')
          .select('*')
          .order('captured_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (snapsErr && snapsErr.code !== 'PGRST301') {
        logger.error('Failed to fetch ga4 snapshots', { module: 'marketing', error: snapsErr });
      }
      if (dimsErr && dimsErr.code !== 'PGRST116' && dimsErr.code !== 'PGRST301') {
        logger.error('Failed to fetch ga4 dimensions', { module: 'marketing', error: dimsErr });
      }

      setSnapshots((snaps ?? []) as unknown as GA4Snapshot[]);
      setDimensions((dims ?? null) as unknown as GA4Dimensions | null);
    } finally {
      setLoading(false);
    }
  }, [startKey, endKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const syncNow = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('sync-ga4-data', { body: {} });
    if (error) throw error;
    if (data && data.success === false) throw new Error(data.error || 'Falha na sincronização');
    await fetchData();
    return data;
  }, [fetchData]);

  // Agregados úteis
  const sum = (k: keyof GA4Snapshot) =>
    snapshots.reduce((s, x) => s + (Number(x[k] ?? 0) || 0), 0);

  const totals = {
    sessions: sum('sessions'),
    users: sum('total_users'),
    newUsers: sum('new_users'),
    pageViews: sum('page_views'),
    conversions: sum('conversions'),
    avgEngagement: snapshots.length
      ? snapshots.reduce((s, x) => s + (Number(x.engagement_rate ?? 0) || 0), 0) / snapshots.length
      : 0,
    avgBounce: snapshots.length
      ? snapshots.reduce((s, x) => s + (Number(x.bounce_rate ?? 0) || 0), 0) / snapshots.length
      : 0,
    avgDuration: snapshots.length
      ? snapshots.reduce((s, x) => s + (Number(x.avg_session_duration ?? 0) || 0), 0) / snapshots.length
      : 0,
  };

  return {
    snapshots,
    dimensions,
    loading,
    refresh: fetchData,
    syncNow,
    totals,
  };
}
