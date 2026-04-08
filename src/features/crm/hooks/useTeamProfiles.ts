import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TeamProfile {
  user_id: string;
  display_name: string;
}

export function useTeamProfiles() {
  return useQuery<TeamProfile[]>({
    queryKey: ['team-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .eq('is_approved', true)
        .order('display_name');
      if (error) throw error;
      return (data ?? []).map(p => ({
        user_id: p.user_id,
        display_name: p.display_name ?? 'Sem nome',
      }));
    },
  });
}
