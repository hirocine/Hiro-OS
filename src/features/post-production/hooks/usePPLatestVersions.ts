import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PPLatestVersion {
  version_number: number;
  frame_io_url: string;
}

/**
 * Returns the highest-numbered (latest) pp_versions row per item, as a
 * stable Map keyed by item_id. Used by PPTable to show a clickable
 * "V{n}" chip in the "Última Versão" column.
 *
 * One query for the whole list (no N+1) — `usePPVersions(itemId)`
 * already covers the per-item case on the detail page.
 */
export function usePPLatestVersions() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['pp-versions', 'latest-by-item'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pp_versions')
        .select('item_id, version_number, frame_io_url')
        .order('version_number', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<{
        item_id: string;
        version_number: number;
        frame_io_url: string;
      }>;
    },
    staleTime: 60_000,
  });

  // First row per item_id wins because we ordered by version_number desc.
  const latestByItem = useMemo(() => {
    const map = new Map<string, PPLatestVersion>();
    for (const row of rows) {
      if (!map.has(row.item_id)) {
        map.set(row.item_id, {
          version_number: row.version_number,
          frame_io_url: row.frame_io_url,
        });
      }
    }
    return map;
  }, [rows]);

  return { latestByItem, isLoading };
}
