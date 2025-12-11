import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { Supplier, SupplierInsert, SupplierUpdate, SupplierFilters } from '../types';
import type { Json } from '@/integrations/supabase/types';

// Helper to log audit entry
async function logAuditEntry(
  action: string,
  tableName: string,
  recordId?: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
) {
  try {
    await supabase.rpc('log_audit_entry', {
      _action: action,
      _table_name: tableName,
      _record_id: recordId,
      _old_values: oldValues as Json,
      _new_values: newValues as Json,
    });
  } catch (error) {
    logger.error('Failed to log audit entry', { module: 'suppliers', data: { error } });
  }
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = async (filters?: SupplierFilters) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('suppliers')
        .select('*')
        .order('full_name', { ascending: true });

      if (filters?.search) {
        query = query.ilike('full_name', `%${filters.search}%`);
      }

      if (filters?.role) {
        query = query.or(`primary_role.eq.${filters.role},secondary_role.eq.${filters.role}`);
      }

      if (filters?.expertise) {
        query = query.eq('expertise', filters.expertise);
      }

      if (filters?.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setSuppliers((data || []) as Supplier[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar fornecedores';
      logger.error('Failed to fetch suppliers', {
        module: 'suppliers',
        action: 'fetch',
        error: err,
      });
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const createSupplier = async (supplier: SupplierInsert) => {
    try {
      const { data, error: insertError } = await supabase
        .from('suppliers')
        .insert(supplier)
        .select()
        .single();

      if (insertError) throw insertError;

      setSuppliers((prev) => [...prev, data as Supplier]);
      
      // Log audit entry
      logAuditEntry('create_supplier', 'suppliers', data.id, undefined, {
        full_name: data.full_name,
        primary_role: data.primary_role,
        expertise: data.expertise,
        rating: data.rating,
        daily_rate: data.daily_rate,
      });
      
      return { data, error: null };
    } catch (err) {
      logger.error('Failed to create supplier', {
        module: 'suppliers',
        action: 'create',
        error: err,
      });
      return { data: null, error: err };
    }
  };

  const updateSupplier = async (id: string, updates: SupplierUpdate, oldData?: Supplier) => {
    try {
      const { data, error: updateError } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setSuppliers((prev) =>
        prev.map((s) => (s.id === id ? (data as Supplier) : s))
      );
      
      // Log audit entry
      logAuditEntry('update_supplier', 'suppliers', id, 
        oldData ? {
          full_name: oldData.full_name,
          primary_role: oldData.primary_role,
          expertise: oldData.expertise,
          rating: oldData.rating,
          daily_rate: oldData.daily_rate,
          is_active: oldData.is_active,
        } : undefined,
        {
          full_name: data.full_name,
          primary_role: data.primary_role,
          expertise: data.expertise,
          rating: data.rating,
          daily_rate: data.daily_rate,
          is_active: data.is_active,
        }
      );
      
      return { data, error: null };
    } catch (err) {
      logger.error('Failed to update supplier', {
        module: 'suppliers',
        action: 'update',
        error: err,
      });
      return { data: null, error: err };
    }
  };

  const deleteSupplier = async (id: string, supplierData?: Supplier) => {
    try {
      const { error: deleteError } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      
      // Log audit entry
      logAuditEntry('delete_supplier', 'suppliers', id, 
        supplierData ? {
          full_name: supplierData.full_name,
          primary_role: supplierData.primary_role,
        } : undefined
      );
      
      return { error: null };
    } catch (err) {
      logger.error('Failed to delete supplier', {
        module: 'suppliers',
        action: 'delete',
        error: err,
      });
      return { error: err };
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  return {
    suppliers,
    loading,
    error,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  };
}
