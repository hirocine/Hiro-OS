import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface CropSettings {
  crop: { x: number; y: number };
  zoom: number;
  rotation: number;
}

export interface TeamMember {
  id: string;
  name: string;
  position: string | null;
  photo_url: string | null;
  original_photo_url: string | null;
  tags: string[];
  display_order: number;
  is_visible: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  crop_settings: CropSettings | null;
}

export interface TeamMemberInsert {
  name: string;
  position?: string;
  photo_url?: string;
  original_photo_url?: string;
  tags?: string[];
  display_order?: number;
  is_visible?: boolean;
  crop_settings?: CropSettings;
}

export interface TeamMemberUpdate extends Partial<TeamMemberInsert> {
  id: string;
}

export const teamMembersQueryKey = ['team-members'] as const;

// Helper to convert database row to typed TeamMember
function mapDbRowToTeamMember(row: Record<string, unknown>): TeamMember {
  return {
    ...row,
    crop_settings: row.crop_settings as CropSettings | null,
  } as TeamMember;
}

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
      return (data || []).map(mapDbRowToTeamMember);
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
          name: member.name,
          position: member.position,
          photo_url: member.photo_url,
          original_photo_url: member.original_photo_url,
          tags: member.tags,
          display_order: member.display_order,
          is_visible: member.is_visible,
          crop_settings: member.crop_settings as unknown as Json,
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
        .update({
          name: updates.name,
          position: updates.position,
          photo_url: updates.photo_url,
          original_photo_url: updates.original_photo_url,
          tags: updates.tags,
          display_order: updates.display_order,
          is_visible: updates.is_visible,
          crop_settings: updates.crop_settings as unknown as Json,
        })
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
