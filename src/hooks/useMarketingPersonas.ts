import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface MarketingPersona {
  id: string;
  name: string;
  description: string | null;
  segment: string | null;
  company_size: string | null;
  avatar_url: string | null;
  main_pains: string[];
  common_objections: string[];
  buying_triggers: string[];
  channels_consumed: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type MarketingPersonaInput = Omit<
  MarketingPersona,
  'id' | 'created_at' | 'updated_at' | 'created_by'
>;

export function useMarketingPersonas() {
  const [personas, setPersonas] = useState<MarketingPersona[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPersonas = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketing_personas')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPersonas((data || []) as MarketingPersona[]);
    } catch (err) {
      logger.error('Failed to fetch personas', { module: 'marketing', error: err });
      toast.error('Erro ao carregar personas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  const createPersona = async (input: MarketingPersonaInput) => {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('marketing_personas')
        .insert({ ...input, created_by: userRes.user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      setPersonas((prev) => [data as MarketingPersona, ...prev]);
      toast.success('Persona criada');
      return data as MarketingPersona;
    } catch (err) {
      logger.error('Failed to create persona', { module: 'marketing', error: err });
      toast.error('Erro ao criar persona');
      throw err;
    }
  };

  const updatePersona = async (id: string, input: Partial<MarketingPersonaInput>) => {
    try {
      const { data, error } = await supabase
        .from('marketing_personas')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      setPersonas((prev) => prev.map((p) => (p.id === id ? (data as MarketingPersona) : p)));
      toast.success('Persona atualizada');
      return data as MarketingPersona;
    } catch (err) {
      logger.error('Failed to update persona', { module: 'marketing', error: err });
      toast.error('Erro ao atualizar persona');
      throw err;
    }
  };

  const deletePersona = async (id: string) => {
    try {
      const { error } = await supabase.from('marketing_personas').delete().eq('id', id);
      if (error) throw error;
      setPersonas((prev) => prev.filter((p) => p.id !== id));
      toast.success('Persona removida');
    } catch (err) {
      logger.error('Failed to delete persona', { module: 'marketing', error: err });
      toast.error('Erro ao remover persona');
      throw err;
    }
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `personas/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from('marketing-assets')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from('marketing-assets').getPublicUrl(path);
    return data.publicUrl;
  };

  return {
    personas,
    loading,
    fetchPersonas,
    createPersona,
    updatePersona,
    deletePersona,
    uploadAvatar,
  };
}
