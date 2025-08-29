import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { EquipmentFilters, SavedFilter } from '@/types/equipment';
import { enhancedToast } from '@/components/ui/enhanced-toast';

export function useSavedFilters() {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(false);

  // Carrega filtros salvos
  const loadSavedFilters = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('saved_filters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedFilters(data || []);
    } catch (error) {
      console.error('Erro ao carregar filtros salvos:', error);
      enhancedToast.error({
        title: 'Erro ao carregar filtros',
        description: 'Não foi possível carregar os filtros salvos.'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Salva um filtro
  const saveFilter = useCallback(async (name: string, filters: EquipmentFilters) => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('saved_filters')
        .insert({
          name,
          filters,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setSavedFilters(prev => [data, ...prev]);
      
      enhancedToast.success({
        title: 'Filtro salvo!',
        description: `Filtro "${name}" foi salvo com sucesso.`
      });

      return data;
    } catch (error) {
      console.error('Erro ao salvar filtro:', error);
      enhancedToast.error({
        title: 'Erro ao salvar filtro',
        description: 'Não foi possível salvar o filtro.'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualiza um filtro
  const updateFilter = useCallback(async (id: string, name: string, filters: EquipmentFilters) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('saved_filters')
        .update({ name, filters })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSavedFilters(prev => 
        prev.map(filter => filter.id === id ? data : filter)
      );
      
      enhancedToast.success({
        title: 'Filtro atualizado!',
        description: `Filtro "${name}" foi atualizado com sucesso.`
      });

      return data;
    } catch (error) {
      console.error('Erro ao atualizar filtro:', error);
      enhancedToast.error({
        title: 'Erro ao atualizar filtro',
        description: 'Não foi possível atualizar o filtro.'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove um filtro
  const deleteFilter = useCallback(async (id: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('saved_filters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSavedFilters(prev => prev.filter(filter => filter.id !== id));
      
      enhancedToast.success({
        title: 'Filtro removido!',
        description: 'Filtro foi removido com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao remover filtro:', error);
      enhancedToast.error({
        title: 'Erro ao remover filtro',
        description: 'Não foi possível remover o filtro.'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega filtros na inicialização
  useEffect(() => {
    loadSavedFilters();
  }, [loadSavedFilters]);

  return {
    savedFilters,
    loading,
    saveFilter,
    updateFilter,
    deleteFilter,
    loadSavedFilters
  };
}