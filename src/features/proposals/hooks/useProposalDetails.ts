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
        // V2 fields
        objetivo: (data as any).objetivo || null,
        diagnostico_dores: Array.isArray((data as any).diagnostico_dores) ? (data as any).diagnostico_dores : [],
        list_price: (data as any).list_price || null,
        payment_options: Array.isArray((data as any).payment_options) ? (data as any).payment_options : [],
        testimonial_name: (data as any).testimonial_name || null,
        testimonial_role: (data as any).testimonial_role || null,
        testimonial_text: (data as any).testimonial_text || null,
        testimonial_image: (data as any).testimonial_image || null,
        entregaveis: Array.isArray((data as any).entregaveis) ? (data as any).entregaveis : [],
        cases: Array.isArray((data as any).cases) ? (data as any).cases : [],
        whatsapp_number: (data as any).whatsapp_number || null,
        views_count: (data as any).views_count || 0,
      } as unknown as Proposal;
    },
    enabled: !!slug,
  });
}
