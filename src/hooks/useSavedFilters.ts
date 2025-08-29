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
        .from('saved_filters' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Mapeia os dados para o formato esperado
      const mappedData: SavedFilter[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        filters: item.filters,
        userId: item.user_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
      
      setSavedFilters(mappedData);
    } catch (error) {
      console.error('Erro ao carregar filtros salvos:', error);
      // Toast removido para evitar spam durante desenvolvimento
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
        .from('saved_filters' as any)
        .insert({
          name,
          filters,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      const mappedData: SavedFilter = {
        id: data.id,
        name: data.name,
        filters: data.filters,
        userId: data.user_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setSavedFilters(prev => [mappedData, ...prev]);
      
      enhancedToast.success({
        title: 'Filtro salvo!',
        description: `Filtro "${name}" foi salvo com sucesso.`
      });

      return mappedData;
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
        .from('saved_filters' as any)
        .update({ name, filters })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const mappedData: SavedFilter = {
        id: data.id,
        name: data.name,
        filters: data.filters,
        userId: data.user_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setSavedFilters(prev => 
        prev.map(filter => filter.id === id ? mappedData : filter)
      );
      
      enhancedToast.success({
        title: 'Filtro atualizado!',
        description: `Filtro "${name}" foi atualizado com sucesso.`
      });

      return mappedData;
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
        .from('saved_filters' as any)
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