import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TeamMember {
  id: string;
  name: string;
  position: string | null;
  photo_url: string | null;
  tags: string[];
  display_order: number;
  is_visible: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMemberInsert {
  name: string;
  position?: string;
  photo_url?: string;
  tags?: string[];
  display_order?: number;
  is_visible?: boolean;
}

export interface TeamMemberUpdate extends Partial<TeamMemberInsert> {
  id: string;
}

export const teamMembersQueryKey = ['team-members'] as const;

export function useTeamMembers() {
  return useQuery({
    queryKey: teamMembersQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as TeamMember[];
    },
  });
}

export function useTeamMemberMutations() {
  const queryClient = useQueryClient();

  const createMember = useMutation({
    mutationFn: async (member: TeamMemberInsert) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          ...member,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamMembersQueryKey });
      toast.success('Membro adicionado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar membro: ' + error.message);
    },
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, ...updates }: TeamMemberUpdate) => {
      const { data, error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamMembersQueryKey });
      toast.success('Membro atualizado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar membro: ' + error.message);
    },
  });

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamMembersQueryKey });
      toast.success('Membro removido com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao remover membro: ' + error.message);
    },
  });

  return {
    createMember,
    updateMember,
    deleteMember,
  };
}
