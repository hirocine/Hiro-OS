import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { logger } from '@/lib/logger';
import { wrapAsync } from '@/lib/errors';
import { toast } from 'sonner';
import type { CompanyPolicy, PolicyForm } from '../types';

export function usePolicies() {
  const [policies, setPolicies] = useState<CompanyPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const { logAuditEntry } = useUserRole();

  const fetchPolicies = async () => {
    const result = await wrapAsync(async () => {
      logger.debug('Fetching policies', { module: 'policies' });
      
      const { data, error } = await supabase
        .from('company_policies')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data;
    });

    if (result.data) {
      setPolicies(result.data);
    } else if (result.error) {
      logger.error('Failed to fetch policies', {
        module: 'policies',
        error: result.error
      });
      toast.error('Erro ao carregar políticas');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchPolicies();

    // Real-time subscription
    const channel = supabase
      .channel('policies-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_policies'
        },
        () => {
          logger.debug('Policies changed, refetching', { module: 'policies' });
          fetchPolicies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addPolicy = async (form: PolicyForm) => {
    const result = await wrapAsync(async () => {
      logger.info('Adding new policy', { module: 'policies' });

      const { data, error } = await supabase
        .from('company_policies')
        .insert({
          title: form.title,
          icon_url: form.icon,
          content: form.content,
          category: form.category,
        })
        .select()
        .single();

      if (error) throw error;

      await logAuditEntry('INSERT', 'company_policies', data.id, undefined, {
        title: form.title
      });

      return data;
    });

    if (result.data) {
      // Atualização otimista: adicionar à lista imediatamente
      setPolicies(prev => [...prev, result.data]);
      toast.success('Política criada com sucesso');
    } else if (result.error) {
      logger.error('Failed to add policy', {
        module: 'policies',
        error: result.error
      });
      toast.error('Erro ao criar política');
      throw result.error;
    }
  };

  const updatePolicy = async (id: string, form: PolicyForm) => {
    const result = await wrapAsync(async () => {
      logger.info('Updating policy', { module: 'policies', data: { id } });

      const oldPolicy = policies.find(p => p.id === id);

      const { data, error } = await supabase
        .from('company_policies')
        .update({
          title: form.title,
          icon_url: form.icon,
          content: form.content,
          category: form.category,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await logAuditEntry('UPDATE', 'company_policies', id, 
        { title: oldPolicy?.title },
        { title: form.title }
      );

      return data;
    });

    if (result.data) {
      // Atualização otimista: atualizar na lista imediatamente
      setPolicies(prev => prev.map(p => p.id === id ? result.data : p));
      toast.success('Política atualizada com sucesso');
    } else if (result.error) {
      logger.error('Failed to update policy', {
        module: 'policies',
        error: result.error
      });
      toast.error('Erro ao atualizar política');
      throw result.error;
    }
  };

  const deletePolicy = async (id: string) => {
    const result = await wrapAsync(async () => {
      logger.info('Deleting policy', { module: 'policies', data: { id } });

      const policy = policies.find(p => p.id === id);

      const { error } = await supabase
        .from('company_policies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await logAuditEntry('DELETE', 'company_policies', id, 
        { title: policy?.title },
        undefined
      );
    });

    if (result.error) {
      logger.error('Failed to delete policy', {
        module: 'policies',
        error: result.error
      });
      toast.error('Erro ao deletar política');
      throw result.error;
    } else {
      // Atualização otimista: remover da lista imediatamente
      setPolicies(prev => prev.filter(p => p.id !== id));
      toast.success('Política deletada com sucesso');
    }
  };

  const getPolicyById = (id: string) => {
    return policies.find(p => p.id === id);
  };

  return {
    policies,
    loading,
    addPolicy,
    updatePolicy,
    deletePolicy,
    getPolicyById
  };
}
