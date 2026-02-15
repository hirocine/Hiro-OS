import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { CompanyNote } from '../types';

export function useCompanyNotes(companyId?: string) {
  const [notes, setNotes] = useState<CompanyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('supplier_company_notes')
        .select('*')
        .eq('company_id', id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setNotes(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar notas';
      logger.error('Failed to fetch company notes', {
        module: 'supplier-companies',
        action: 'fetch_notes',
        error: err,
      });
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (companyId: string, content: string, createdByName?: string) => {
    try {
      const { data, error: insertError } = await supabase
        .from('supplier_company_notes')
        .insert({
          company_id: companyId,
          content,
          created_by_name: createdByName,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setNotes((prev) => [data, ...prev]);
      return { data, error: null };
    } catch (err) {
      logger.error('Failed to create company note', {
        module: 'supplier-companies',
        action: 'create_note',
        error: err,
      });
      return { data: null, error: err };
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('supplier_company_notes')
        .delete()
        .eq('id', noteId);

      if (deleteError) throw deleteError;

      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      return { error: null };
    } catch (err) {
      logger.error('Failed to delete company note', {
        module: 'supplier-companies',
        action: 'delete_note',
        error: err,
      });
      return { error: err };
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchNotes(companyId);
    }
  }, [companyId]);

  return {
    notes,
    loading,
    error,
    fetchNotes,
    createNote,
    deleteNote,
  };
}
