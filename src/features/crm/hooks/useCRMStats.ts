import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CRMStats } from '../types/crm.types';

export function useCRMStats() {
  return useQuery<CRMStats>({
    queryKey: ['crm-stats'],
    queryFn: async () => {
      const [contactsRes, dealsRes, stagesRes] = await Promise.all([
        supabase.from('crm_contacts').select('id', { count: 'exact', head: true }),
        supabase.from('crm_deals').select('id, estimated_value, stage_id, closed_at'),
        supabase.from('crm_pipeline_stages').select('id, is_won, is_lost'),
      ]);

      const totalContacts = contactsRes.count ?? 0;
      const deals = dealsRes.data ?? [];
      const stages = stagesRes.data ?? [];

      const wonIds = new Set(stages.filter(s => s.is_won).map(s => s.id));
      const lostIds = new Set(stages.filter(s => s.is_lost).map(s => s.id));
      const closedIds = new Set([...wonIds, ...lostIds]);

      const activeDeals = deals.filter(d => !closedIds.has(d.stage_id)).length;
      const pipelineValue = deals
        .filter(d => !closedIds.has(d.stage_id))
        .reduce((sum, d) => sum + (d.estimated_value ?? 0), 0);

      const wonCount = deals.filter(d => wonIds.has(d.stage_id)).length;
      const closedCount = deals.filter(d => closedIds.has(d.stage_id)).length;
      const conversionRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;

      return { totalContacts, activeDeals, pipelineValue, conversionRate };
    },
  });
}
