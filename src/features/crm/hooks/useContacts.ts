import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Contact, ContactInsert, ContactUpdate } from '../types/crm.types';
import { toast } from 'sonner';

interface ContactFilters {
  search?: string;
  contactType?: string;
  leadSource?: string;
  assignedTo?: string;
}

export function useContacts(filters?: ContactFilters) {
  return useQuery<Contact[]>({
    queryKey: ['crm-contacts', filters],
    queryFn: async () => {
      let query = supabase.from('crm_contacts').select('*').order('created_at', { ascending: false });

      if (filters?.contactType) {
        query = query.eq('contact_type', filters.contactType);
      }
      if (filters?.leadSource) {
        query = query.eq('lead_source', filters.leadSource);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
      }
      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useContactMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['crm-contacts'] });

  const createContact = useMutation({
    mutationFn: async (contact: ContactInsert) => {
      const { data, error } = await supabase.from('crm_contacts').insert(contact).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Contato criado'); },
    onError: () => toast.error('Erro ao criar contato'),
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, ...updates }: ContactUpdate & { id: string }) => {
      const { data, error } = await supabase.from('crm_contacts').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Contato atualizado'); },
    onError: () => toast.error('Erro ao atualizar contato'),
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('crm_contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Contato removido'); },
    onError: () => toast.error('Erro ao remover contato'),
  });

  return { createContact, updateContact, deleteContact };
}
