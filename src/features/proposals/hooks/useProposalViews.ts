import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useProposalViews(proposalId: string | undefined) {
  return useQuery({
    queryKey: ['proposal-views', proposalId],
    queryFn: async () => {
      if (!proposalId) throw new Error('ID não fornecido');
      const { data, error } = await (supabase as any)
        .from('proposal_views')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('viewed_at', { ascending: false });
      if (error) throw error;
      return data as Array<{
        id: string;
        proposal_id: string;
        viewed_at: string;
        user_agent: string | null;
        device_type: string | null;
        referrer: string | null;
        time_on_page_seconds: number | null;
        ip_address: string | null;
      }>;
    },
    enabled: !!proposalId,
  });
}
