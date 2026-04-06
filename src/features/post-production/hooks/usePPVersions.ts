import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PPVersion {
  id: string;
  item_id: string;
  version_number: number;
  frame_io_url: string;
  status: 'em_revisao' | 'aprovada' | 'arquivada';
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export function usePPVersions(itemId: string) {
  const qc = useQueryClient();

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['pp-versions', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pp_versions')
        .select('*')
        .eq('item_id', itemId)
        .order('version_number', { ascending: false });
      if (error) throw error;
      return data as PPVersion[];
    },
    enabled: !!itemId,
  });

  const addVersion = useMutation({
    mutationFn: async ({ frame_io_url, notes }: { frame_io_url: string; notes?: string }) => {
      const nextNumber = versions.length > 0 ? versions[0].version_number + 1 : 1;
      // Archive previous versions
      if (versions.length > 0) {
        await supabase.from('pp_versions').update({ status: 'arquivada' }).eq('item_id', itemId).neq('status', 'arquivada');
      }
      const { error } = await supabase.from('pp_versions').insert({
        item_id: itemId,
        version_number: nextNumber,
        frame_io_url,
        notes: notes || null,
        status: 'em_revisao',
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pp-versions', itemId] }); toast.success('Versão adicionada!'); },
    onError: () => toast.error('Erro ao adicionar versão'),
  });

  const updateVersionStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PPVersion['status'] }) => {
      const { error } = await supabase.from('pp_versions').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pp-versions', itemId] }),
  });

  const latestVersion = versions[0] ?? null;

  return { versions, isLoading, addVersion, updateVersionStatus, latestVersion };
}
