import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { SupplierRole } from '../types';

export function useSupplierRoles() {
  const [roles, setRoles] = useState<SupplierRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('supplier_roles')
        .select('*')
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;

      setRoles(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar funções';
      logger.error('Failed to fetch supplier roles', {
        module: 'suppliers',
        action: 'fetch_roles',
        error: err,
      });
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const createRole = async (name: string) => {
    try {
      const { data, error: insertError } = await supabase
        .from('supplier_roles')
        .insert({
          name,
          is_custom: true,
          display_order: 999,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setRoles((prev) => [...prev, data]);
      return { data, error: null };
    } catch (err) {
      logger.error('Failed to create supplier role', {
        module: 'suppliers',
        action: 'create_role',
        error: err,
      });
      return { data: null, error: err };
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return {
    roles,
    loading,
    error,
    fetchRoles,
    createRole,
  };
}
