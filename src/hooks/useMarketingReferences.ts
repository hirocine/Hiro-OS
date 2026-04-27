import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface MarketingReference {
  id: string;
  title: string;
  description: string | null;
  source_url: string | null;
  image_url: string | null;
  platform: string | null;
  tags: string[];
  category: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type MarketingReferenceInput = Omit<
  MarketingReference,
  'id' | 'created_at' | 'updated_at' | 'created_by'
>;

export function useMarketingReferences() {
  const [references, setReferences] = useState<MarketingReference[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReferences = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketing_references')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReferences((data || []) as MarketingReference[]);
    } catch (err) {
      logger.error('Failed to fetch marketing references', { module: 'marketing', error: err });
      toast.error('Erro ao carregar referências');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferences();
  }, [fetchReferences]);

  const createReference = async (input: MarketingReferenceInput) => {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('marketing_references')
        .insert({ ...input, created_by: userRes.user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      setReferences((prev) => [data as MarketingReference, ...prev]);
      toast.success('Referência criada');
      return data as MarketingReference;
    } catch (err) {
      logger.error('Failed to create reference', { module: 'marketing', error: err });
      toast.error('Erro ao criar referência');
      throw err;
    }
  };

  const updateReference = async (id: string, input: Partial<MarketingReferenceInput>) => {
    try {
      const { data, error } = await supabase
        .from('marketing_references')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      setReferences((prev) => prev.map((r) => (r.id === id ? (data as MarketingReference) : r)));
      toast.success('Referência atualizada');
      return data as MarketingReference;
    } catch (err) {
      logger.error('Failed to update reference', { module: 'marketing', error: err });
      toast.error('Erro ao atualizar referência');
      throw err;
    }
  };

  const deleteReference = async (id: string) => {
    try {
      const { error } = await supabase.from('marketing_references').delete().eq('id', id);
      if (error) throw error;
      setReferences((prev) => prev.filter((r) => r.id !== id));
      toast.success('Referência removida');
    } catch (err) {
      logger.error('Failed to delete reference', { module: 'marketing', error: err });
      toast.error('Erro ao remover referência');
      throw err;
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `references/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from('marketing-assets')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from('marketing-assets').getPublicUrl(path);
    return data.publicUrl;
  };

  return {
    references,
    loading,
    fetchReferences,
    createReference,
    updateReference,
    deleteReference,
    uploadImage,
  };
}
