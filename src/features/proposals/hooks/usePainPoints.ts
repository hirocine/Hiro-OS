import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PainPoint } from '../types';

export function usePainPoints() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['proposal-pain-points'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposal_pain_points' as any)
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as PainPoint[];
    },
  });

  const createPainPoint = useMutation({
    mutationFn: async (pp: { label: string; title: string; description: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('proposal_pain_points' as any)
        .insert({ ...pp, created_by: userData?.user?.id || null } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as PainPoint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-pain-points'] });
    },
  });

  return { ...query, createPainPoint };
}
