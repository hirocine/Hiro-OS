import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Proposal } from '../types';

export function useProposalDetails(slug: string | undefined) {
  return useQuery({
    queryKey: ['proposal', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Slug não fornecido');
      const { data, error } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return {
        ...data,
        moodboard_images: Array.isArray(data.moodboard_images) ? data.moodboard_images : [],
        scope_pre_production: Array.isArray(data.scope_pre_production) ? data.scope_pre_production : [],
        scope_production: Array.isArray(data.scope_production) ? data.scope_production : [],
        scope_post_production: Array.isArray(data.scope_post_production) ? data.scope_post_production : [],
        timeline: Array.isArray(data.timeline) ? data.timeline : [],
      } as unknown as Proposal;
    },
    enabled: !!slug,
  });
}
