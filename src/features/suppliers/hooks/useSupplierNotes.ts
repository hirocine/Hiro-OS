import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { SupplierNote } from '../types';

export function useSupplierNotes(supplierId?: string) {
  const [notes, setNotes] = useState<SupplierNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('supplier_notes')
        .select('*')
        .eq('supplier_id', id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setNotes(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar notas';
      logger.error('Failed to fetch supplier notes', {
        module: 'suppliers',
        action: 'fetch_notes',
        error: err,
      });
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (supplierId: string, content: string, createdByName?: string) => {
    try {
      const { data, error: insertError } = await supabase
        .from('supplier_notes')
        .insert({
          supplier_id: supplierId,
          content,
          created_by_name: createdByName,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setNotes((prev) => [data, ...prev]);
      return { data, error: null };
    } catch (err) {
      logger.error('Failed to create supplier note', {
        module: 'suppliers',
        action: 'create_note',
        error: err,
      });
      return { data: null, error: err };
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('supplier_notes')
        .delete()
        .eq('id', noteId);

      if (deleteError) throw deleteError;

      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      return { error: null };
    } catch (err) {
      logger.error('Failed to delete supplier note', {
        module: 'suppliers',
        action: 'delete_note',
        error: err,
      });
      return { error: err };
    }
  };

  useEffect(() => {
    if (supplierId) {
      fetchNotes(supplierId);
    }
  }, [supplierId]);

  return {
    notes,
    loading,
    error,
    fetchNotes,
    createNote,
    deleteNote,
  };
}
