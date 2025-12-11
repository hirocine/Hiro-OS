import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AVProject, AVProjectStats } from '../types';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { logger } from '@/lib/logger';
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
    logger.error('Failed to log audit entry', { module: 'av-projects', data: { error } });
  }
}

const queryKeys = {
  all: ['av-projects'] as const,
  list: (status?: string) => [...queryKeys.all, 'list', status] as const,
  detail: (id: string) => [...queryKeys.all, 'detail', id] as const,
  stats: ['av-projects', 'stats'] as const,
};

export function useAVProjects(status?: string) {
  return useQuery({
    queryKey: queryKeys.list(status),
    queryFn: async () => {
      let query = supabase
        .from('audiovisual_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AVProject[];
    },
  });
}

export function useAVProjectStats() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      const { data: projects, error } = await supabase
        .from('audiovisual_projects')
        .select('status, deadline');

      if (error) throw error;

      const stats: AVProjectStats = {
        active: 0,
        overdue: 0,
        completed: 0,
      };

      (projects || []).forEach((project) => {
        if (project.status === 'active') {
          stats.active++;
          if (project.deadline && project.deadline < today) {
            stats.overdue++;
          }
        } else if (project.status === 'completed') {
          stats.completed++;
        }
      });

      return stats;
    },
  });
}

export function useCreateAVProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (project: { name: string } & Partial<AVProject>) => {
      const { data, error } = await supabase
        .from('audiovisual_projects')
        .insert([project as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
      enhancedToast.success({ title: 'Projeto criado com sucesso' });
      
      // Log audit entry
      logAuditEntry('create_av_project', 'audiovisual_projects', data.id, undefined, {
        name: data.name,
        company: data.company,
        status: data.status,
        deadline: data.deadline,
      });
    },
    onError: (error) => {
      enhancedToast.error({ title: 'Erro ao criar projeto', description: error.message });
    },
  });
}

export function useUpdateAVProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, oldData, ...updates }: Partial<AVProject> & { id: string; oldData?: Partial<AVProject> }) => {
      const { data, error } = await supabase
        .from('audiovisual_projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, oldData };
    },
    onSuccess: ({ data, oldData }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.detail(data.id) });
      enhancedToast.success({ title: 'Projeto atualizado' });
      
      // Log audit entry
      logAuditEntry('update_av_project', 'audiovisual_projects', data.id, 
        oldData ? {
          name: oldData.name,
          company: oldData.company,
          status: oldData.status,
          deadline: oldData.deadline,
        } : undefined,
        {
          name: data.name,
          company: data.company,
          status: data.status,
          deadline: data.deadline,
        }
      );
    },
    onError: (error) => {
      enhancedToast.error({ title: 'Erro ao atualizar projeto', description: error.message });
    },
  });
}

export function useDeleteAVProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectData }: { id: string; projectData?: Partial<AVProject> }) => {
      const { error } = await supabase
        .from('audiovisual_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, projectData };
    },
    onSuccess: ({ id, projectData }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
      enhancedToast.success({ title: 'Projeto excluído' });
      
      // Log audit entry
      logAuditEntry('delete_av_project', 'audiovisual_projects', id, 
        projectData ? {
          name: projectData.name,
          company: projectData.company,
        } : undefined
      );
    },
    onError: (error) => {
      enhancedToast.error({ title: 'Erro ao excluir projeto', description: error.message });
    },
  });
}
