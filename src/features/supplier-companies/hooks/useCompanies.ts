import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { Company, CompanyInsert, CompanyUpdate, CompanyFilters } from '../types';

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = async (filters?: CompanyFilters) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('supplier_companies')
        .select('*')
        .order('company_name', { ascending: true });

      if (filters?.search) {
        query = query.ilike('company_name', `%${filters.search}%`);
      }

      if (filters?.area) {
        query = query.eq('area', filters.area);
      }

      if (filters?.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setCompanies((data || []) as Company[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar empresas';
      logger.error('Failed to fetch companies', {
        module: 'supplier-companies',
        action: 'fetch',
        error: err,
      });
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const createCompany = async (company: CompanyInsert) => {
    try {
      const { data, error: insertError } = await supabase
        .from('supplier_companies')
        .insert(company)
        .select()
        .single();

      if (insertError) throw insertError;

      setCompanies((prev) => [...prev, data as Company]);
      return { data, error: null };
    } catch (err) {
      logger.error('Failed to create company', {
        module: 'supplier-companies',
        action: 'create',
        error: err,
      });
      return { data: null, error: err };
    }
  };

  const updateCompany = async (id: string, updates: CompanyUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('supplier_companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setCompanies((prev) =>
        prev.map((c) => (c.id === id ? (data as Company) : c))
      );
      return { data, error: null };
    } catch (err) {
      logger.error('Failed to update company', {
        module: 'supplier-companies',
        action: 'update',
        error: err,
      });
      return { data: null, error: err };
    }
  };

  const deleteCompany = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('supplier_companies')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setCompanies((prev) => prev.filter((c) => c.id !== id));
      return { error: null };
    } catch (err) {
      logger.error('Failed to delete company', {
        module: 'supplier-companies',
        action: 'delete',
        error: err,
      });
      return { error: err };
    }
  };

  // No automatic fetch on mount — pages control when to fetch via fetchCompanies(filters)

  return {
    companies,
    loading,
    error,
    fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
  };
}
