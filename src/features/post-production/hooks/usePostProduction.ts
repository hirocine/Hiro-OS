import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PostProductionItem } from '../types';
import { logger } from '@/lib/logger';

export const ppQueryKeys = {
  all: ['post-production'] as const,
  list: ['post-production', 'list'] as const,
  detail: (id: string) => ['post-production', id] as const,
};

export function usePostProduction() {
  const { data: items = [], isLoading, error, refetch } = useQuery({
    queryKey: ppQueryKeys.list,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      logger.debug('Fetching post production queue', { module: 'post-production' });

      const { data, error } = await supabase
        .from('post_production_queue')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching post production queue', { module: 'post-production', error });
        throw error;
      }

      return (data || []) as PostProductionItem[];
    },
  });

  return { items, isLoading, error, refetch };
}
