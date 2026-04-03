import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ProposalCase } from '../types';

export function useProposalCases() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['proposal-cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposal_cases' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ProposalCase[];
    },
  });

  const createCase = useMutation({
    mutationFn: async (c: { tags: string[]; client_name: string; campaign_name: string; vimeo_id: string; vimeo_hash: string; destaque: boolean }) => {
      const { data: userData } = await supabase.auth.getUser();
      const tipo = c.tags[0] || '';
      const { data, error } = await supabase
        .from('proposal_cases' as any)
        .insert({ ...c, tipo, created_by: userData?.user?.id || null } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ProposalCase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-cases'] });
    },
  });

  return { ...query, createCase };
}
