import { useCallback, useEffect, useMemo, useState } from 'react';
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

/** Versão agregada das dimensões dentro do range do PeriodPicker */
export interface GA4DimensionsAggregated {
  sources_breakdown: Record<string, number>;
  top_pages: Array<{ path: string; views: number }>;
  mediums_breakdown: Record<string, number>;
  devices_breakdown: Record<string, number>;
  countries_breakdown: Record<string, number>;
  exit_pages: Array<{ path: string; exits: number; views: number; exit_rate: number }>;
  conversion_events: Array<{ event_name: string; count: number }>;
}

export interface GA4Range {
  start: Date | null;
  end: Date | null;
}

export function useMarketingGA4(range: GA4Range = { start: null, end: null }) {
  const [snapshots, setSnapshots] = useState<GA4Snapshot[]>([]);
  const [dimensionRows, setDimensionRows] = useState<GA4Dimensions[]>([]);
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

      let dimsQ = supabase
        .from('marketing_ga4_dimensions')
        .select('*')
        .order('captured_date', { ascending: true });

      if (startKey) dimsQ = dimsQ.gte('captured_date', startKey);
      if (endKey) dimsQ = dimsQ.lte('captured_date', endKey);

      const [{ data: snaps, error: snapsErr }, { data: dims, error: dimsErr }] = await Promise.all([
        snapsQ,
        dimsQ,
      ]);

      if (snapsErr && snapsErr.code !== 'PGRST301') {
        logger.error('Failed to fetch ga4 snapshots', { module: 'marketing', error: snapsErr });
      }
      if (dimsErr && dimsErr.code !== 'PGRST301') {
        logger.error('Failed to fetch ga4 dimensions', { module: 'marketing', error: dimsErr });
      }

      setSnapshots((snaps ?? []) as unknown as GA4Snapshot[]);
      setDimensionRows((dims ?? []) as unknown as GA4Dimensions[]);
    } finally {
      setLoading(false);
    }
  }, [startKey, endKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const syncNow = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('sync-ga4-data', { body: {} });
    if (error) throw error;
    if (data && data.success === false) throw new Error(data.error || 'Falha na sincronização');
    if (!data?.cached) {
      await fetchData();
    }
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

  // Agregação client-side das dimensões dentro do range
  const dimensions = useMemo<GA4DimensionsAggregated | null>(() => {
    if (dimensionRows.length === 0) return null;

    const sources_breakdown: Record<string, number> = {};
    const devices_breakdown: Record<string, number> = {};
    const mediums_breakdown: Record<string, number> = {};
    const countries_breakdown: Record<string, number> = {};
    const pagesAcc: Record<string, number> = {};
    const exitPagesAcc: Record<string, { exits: number; views: number }> = {};
    const eventsAcc: Record<string, number> = {};

    for (const row of dimensionRows) {
      Object.entries(row.sources_breakdown ?? {}).forEach(([k, v]) => {
        sources_breakdown[k] = (sources_breakdown[k] ?? 0) + (v ?? 0);
      });
      Object.entries(row.devices_breakdown ?? {}).forEach(([k, v]) => {
        devices_breakdown[k] = (devices_breakdown[k] ?? 0) + (v ?? 0);
      });
      Object.entries(row.mediums_breakdown ?? {}).forEach(([k, v]) => {
        mediums_breakdown[k] = (mediums_breakdown[k] ?? 0) + (v ?? 0);
      });
      Object.entries(row.countries_breakdown ?? {}).forEach(([k, v]) => {
        countries_breakdown[k] = (countries_breakdown[k] ?? 0) + (v ?? 0);
      });

      (row.top_pages ?? []).forEach((p) => {
        pagesAcc[p.path] = (pagesAcc[p.path] ?? 0) + (p.views ?? 0);
      });

      (row.exit_pages ?? []).forEach((p) => {
        const acc = exitPagesAcc[p.path] ?? { exits: 0, views: 0 };
        acc.exits += p.exits ?? 0;
        acc.views += p.views ?? 0;
        exitPagesAcc[p.path] = acc;
      });

      (row.conversion_events ?? []).forEach((e) => {
        eventsAcc[e.event_name] = (eventsAcc[e.event_name] ?? 0) + (e.count ?? 0);
      });
    }

    const top_pages = Object.entries(pagesAcc)
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    const exit_pages = Object.entries(exitPagesAcc)
      .map(([path, { exits, views }]) => ({
        path,
        exits,
        views,
        exit_rate: views > 0 ? exits / views : 0,
      }))
      .sort((a, b) => b.exits - a.exits)
      .slice(0, 10);

    const conversion_events = Object.entries(eventsAcc)
      .map(([event_name, count]) => ({ event_name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      sources_breakdown,
      top_pages,
      mediums_breakdown,
      devices_breakdown,
      countries_breakdown,
      exit_pages,
      conversion_events,
    };
  }, [dimensionRows]);

  return {
    snapshots,
    dimensions,
    loading,
    refresh: fetchData,
    syncNow,
    totals,
  };
}
