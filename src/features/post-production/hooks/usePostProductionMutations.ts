import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ppQueryKeys } from './usePostProduction';
import { PostProductionItem } from '../types';
import { logger } from '@/lib/logger';
import { enhancedToast } from '@/components/ui/enhanced-toast';

export function usePostProductionMutations() {
  const queryClient = useQueryClient();

  const createItem = useMutation({
    mutationFn: async (newItem: Partial<PostProductionItem> & { title: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('post_production_queue')
        .insert([{ ...newItem, created_by: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ppQueryKeys.list });
      enhancedToast.success({ title: 'Vídeo adicionado à esteira!' });
    },
    onError: (error: Error) => {
      logger.error('Error creating post production item', { module: 'post-production', error });
      enhancedToast.error({ title: 'Erro ao adicionar vídeo', description: error.message });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PostProductionItem> }) => {
      const { data, error } = await supabase
        .from('post_production_queue')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ppQueryKeys.list });
      enhancedToast.success({ title: 'Vídeo atualizado!' });
    },
    onError: (error: Error) => {
      logger.error('Error updating post production item', { module: 'post-production', error });
      enhancedToast.error({ title: 'Erro ao atualizar vídeo', description: error.message });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('post_production_queue')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ppQueryKeys.list });
      enhancedToast.success({ title: 'Vídeo removido da esteira!' });
    },
    onError: (error: Error) => {
      logger.error('Error deleting post production item', { module: 'post-production', error });
      enhancedToast.error({ title: 'Erro ao remover vídeo', description: error.message });
    },
  });

  return { createItem, updateItem, deleteItem };
}
