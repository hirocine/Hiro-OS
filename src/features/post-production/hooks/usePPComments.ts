import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PPComment {
  id: string;
  item_id: string;
  user_id: string | null;
  user_name: string | null;
  content: string;
  created_at: string;
}

export function usePPComments(itemId: string) {
  const qc = useQueryClient();
  const { user } = useAuthContext();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['pp-comments', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pp_comments')
        .select('*')
        .eq('item_id', itemId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PPComment[];
    },
    enabled: !!itemId,
  });

  const addComment = useMutation({
    mutationFn: async (content: string) => {
      const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
      const { error } = await supabase.from('pp_comments').insert({
        item_id: itemId,
        user_id: user?.id || null,
        user_name: displayName,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pp-comments', itemId] }),
    onError: () => toast.error('Erro ao adicionar comentário'),
  });

  return { comments, isLoading, addComment };
}
