import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export type IdeaStatus = 'rascunho' | 'validada' | 'em_producao' | 'publicada' | 'descartada';

export interface MarketingIdea {
  id: string;
  title: string;
  description: string | null;
  status: IdeaStatus;
  source: string | null;
  format: string | null;
  pillar_id: string | null;
  tags: string[];
  reference_ids: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type MarketingIdeaInput = Omit<MarketingIdea, 'id' | 'created_at' | 'updated_at' | 'created_by'>;

export const IDEA_STATUSES: { value: IdeaStatus; label: string; emoji: string }[] = [
  { value: 'rascunho', label: 'Rascunho', emoji: '📝' },
  { value: 'validada', label: 'Validada', emoji: '✅' },
  { value: 'em_producao', label: 'Em produção', emoji: '🎬' },
  { value: 'publicada', label: 'Publicada', emoji: '🚀' },
  { value: 'descartada', label: 'Descartada', emoji: '🗑️' },
];

export const IDEA_SOURCES = [
  { value: 'brainstorm', label: 'Brainstorm' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'referencia', label: 'Referência' },
  { value: 'tendencia', label: 'Tendência' },
  { value: 'outro', label: 'Outro' },
];

export function useMarketingIdeas() {
  const [ideas, setIdeas] = useState<MarketingIdea[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIdeas = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketing_ideas')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setIdeas((data || []) as MarketingIdea[]);
    } catch (err) {
      logger.error('Failed to fetch marketing ideas', { module: 'marketing', error: err });
      toast.error('Erro ao carregar ideias');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const createIdea = async (input: MarketingIdeaInput) => {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('marketing_ideas')
        .insert({ ...input, created_by: userRes.user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      setIdeas((prev) => [data as MarketingIdea, ...prev]);
      toast.success('Ideia criada');
      return data as MarketingIdea;
    } catch (err) {
      logger.error('Failed to create idea', { module: 'marketing', error: err });
      toast.error('Erro ao criar ideia');
      throw err;
    }
  };

  const updateIdea = async (id: string, input: Partial<MarketingIdeaInput>) => {
    try {
      const { data, error } = await supabase
        .from('marketing_ideas')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      setIdeas((prev) => prev.map((i) => (i.id === id ? (data as MarketingIdea) : i)));
      return data as MarketingIdea;
    } catch (err) {
      logger.error('Failed to update idea', { module: 'marketing', error: err });
      toast.error('Erro ao atualizar ideia');
      throw err;
    }
  };

  const updateStatus = async (id: string, status: IdeaStatus) => {
    // Optimistic update
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    try {
      const { error } = await supabase.from('marketing_ideas').update({ status }).eq('id', id);
      if (error) throw error;
    } catch (err) {
      logger.error('Failed to update idea status', { module: 'marketing', error: err });
      toast.error('Erro ao mover ideia');
      fetchIdeas();
    }
  };

  const deleteIdea = async (id: string) => {
    try {
      const { error } = await supabase.from('marketing_ideas').delete().eq('id', id);
      if (error) throw error;
      setIdeas((prev) => prev.filter((i) => i.id !== id));
      toast.success('Ideia removida');
    } catch (err) {
      logger.error('Failed to delete idea', { module: 'marketing', error: err });
      toast.error('Erro ao remover ideia');
      throw err;
    }
  };

  const duplicateIdea = async (idea: MarketingIdea) => {
    return createIdea({
      title: `${idea.title} (cópia)`,
      description: idea.description,
      status: 'rascunho',
      source: idea.source,
      format: idea.format,
      pillar_id: idea.pillar_id,
      tags: idea.tags,
      reference_ids: idea.reference_ids,
    });
  };

  return {
    ideas,
    loading,
    fetchIdeas,
    createIdea,
    updateIdea,
    updateStatus,
    deleteIdea,
    duplicateIdea,
  };
}
