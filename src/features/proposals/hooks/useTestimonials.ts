import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Testimonial } from '../types';

export function useTestimonials() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['proposal-testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposal_testimonials' as any)
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as Testimonial[];
    },
  });

  const createTestimonial = useMutation({
    mutationFn: async (t: { name: string; role: string; text: string; image?: string | null }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('proposal_testimonials' as any)
        .insert({ ...t, created_by: userData?.user?.id || null } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Testimonial;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-testimonials'] });
    },
  });

  return { ...query, createTestimonial };
}
