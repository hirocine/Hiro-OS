import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface MarketingPillar {
  id: string;
  name: string;
  description: string | null;
  color: string;
  target_percentage: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type MarketingPillarInput = Omit<MarketingPillar, 'id' | 'created_at' | 'updated_at' | 'created_by'>;

export function useMarketingPillars() {
  const [pillars, setPillars] = useState<MarketingPillar[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPillars = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketing_pillars')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setPillars((data || []) as MarketingPillar[]);
    } catch (err) {
      logger.error('Failed to fetch marketing pillars', { module: 'marketing', error: err });
      toast.error('Erro ao carregar pilares');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPillars();
  }, [fetchPillars]);

  const createPillar = async (input: MarketingPillarInput) => {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('marketing_pillars')
        .insert({ ...input, created_by: userRes.user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      setPillars((prev) => [...prev, data as MarketingPillar]);
      toast.success('Pilar criado');
      return data as MarketingPillar;
    } catch (err) {
      logger.error('Failed to create pillar', { module: 'marketing', error: err });
      toast.error('Erro ao criar pilar');
      throw err;
    }
  };

  const updatePillar = async (id: string, input: Partial<MarketingPillarInput>) => {
    try {
      const { data, error } = await supabase
        .from('marketing_pillars')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      setPillars((prev) => prev.map((p) => (p.id === id ? (data as MarketingPillar) : p)));
      toast.success('Pilar atualizado');
      return data as MarketingPillar;
    } catch (err) {
      logger.error('Failed to update pillar', { module: 'marketing', error: err });
      toast.error('Erro ao atualizar pilar');
      throw err;
    }
  };

  const deletePillar = async (id: string) => {
    try {
      const { error } = await supabase.from('marketing_pillars').delete().eq('id', id);
      if (error) throw error;
      setPillars((prev) => prev.filter((p) => p.id !== id));
      toast.success('Pilar removido');
    } catch (err) {
      logger.error('Failed to delete pillar', { module: 'marketing', error: err });
      toast.error('Erro ao remover pilar');
      throw err;
    }
  };

  return { pillars, loading, fetchPillars, createPillar, updatePillar, deletePillar };
}
