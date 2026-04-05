import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Proposal } from '../types';

export function useProposalDetailsBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['proposal-by-slug', slug],
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
        client_logo: data.client_logo || null,
        moodboard_images: Array.isArray(data.moodboard_images) ? data.moodboard_images : [],
        scope_pre_production: Array.isArray(data.scope_pre_production) ? data.scope_pre_production : [],
        scope_production: Array.isArray(data.scope_production) ? data.scope_production : [],
        scope_post_production: Array.isArray(data.scope_post_production) ? data.scope_post_production : [],
        timeline: Array.isArray(data.timeline) ? data.timeline : [],
        diagnostico_dores: Array.isArray((data as any).diagnostico_dores) ? (data as any).diagnostico_dores : [],
        payment_options: Array.isArray((data as any).payment_options) ? (data as any).payment_options : [],
        entregaveis: Array.isArray((data as any).entregaveis) ? (data as any).entregaveis : [],
        cases: Array.isArray((data as any).cases) ? (data as any).cases : [],
        version: (data as any).version || 1,
        parent_id: (data as any).parent_id || null,
        is_latest_version: (data as any).is_latest_version !== false,
      } as unknown as Proposal;
    },
    enabled: !!slug,
  });
}
