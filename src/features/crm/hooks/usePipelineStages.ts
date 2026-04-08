import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PipelineStage } from '../types/crm.types';

export function usePipelineStages() {
  return useQuery<PipelineStage[]>({
    queryKey: ['crm-pipeline-stages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_pipeline_stages')
        .select('*')
        .order('position', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
