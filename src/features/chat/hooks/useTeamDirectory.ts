import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DirectoryProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  position: string | null;
}

/**
 * All approved users — used for "Open DM with…" and "Add members…" pickers.
 */
export function useTeamDirectory() {
  return useQuery({
    queryKey: ['chat', 'team-directory'],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<DirectoryProfile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, position')
        .eq('is_approved', true)
        .order('display_name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as DirectoryProfile[];
    },
  });
}
