import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AVProject, AVProjectSection, AVProjectStep, AVProjectSubstep } from '../types';
import { enhancedToast } from '@/components/ui/enhanced-toast';

const queryKeys = {
  project: (id: string) => ['av-projects', 'detail', id] as const,
  sections: ['av-project-sections'] as const,
  steps: (projectId: string) => ['av-project-steps', projectId] as const,
  substeps: (stepId: string) => ['av-project-substeps', stepId] as const,
};

export function useAVProject(id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audiovisual_projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as AVProject | null;
    },
    enabled: !!id,
  });
}

export function useAVProjectSections() {
  return useQuery({
    queryKey: queryKeys.sections,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('av_project_sections')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as AVProjectSection[];
    },
  });
}

export function useAVProjectSteps(projectId: string) {
  return useQuery({
    queryKey: queryKeys.steps(projectId),
    queryFn: async () => {
      const { data: steps, error: stepsError } = await supabase
        .from('av_project_steps')
        .select('*')
        .eq('project_id', projectId)
        .order('display_order', { ascending: true });

      if (stepsError) throw stepsError;

      // Fetch substeps for all steps
      const stepIds = (steps || []).map((s) => s.id);
      
      if (stepIds.length === 0) {
        return [] as AVProjectStep[];
      }

      const { data: substeps, error: substepsError } = await supabase
        .from('av_project_substeps')
        .select('*')
        .in('step_id', stepIds)
        .order('display_order', { ascending: true });

      if (substepsError) throw substepsError;

      // Group substeps by step_id
      const substepsByStep = (substeps || []).reduce((acc, substep) => {
        if (!acc[substep.step_id]) {
          acc[substep.step_id] = [];
        }
        acc[substep.step_id].push(substep);
        return acc;
      }, {} as Record<string, AVProjectSubstep[]>);

      // Attach substeps to steps
      return (steps || []).map((step) => ({
        ...step,
        substeps: substepsByStep[step.id] || [],
      })) as AVProjectStep[];
    },
    enabled: !!projectId,
  });
}

export function useUpdateAVStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId, ...updates }: Partial<AVProjectStep> & { id: string; projectId: string }) => {
      const { data, error } = await supabase
        .from('av_project_steps')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.steps(data.projectId) });
    },
    onError: (error) => {
      enhancedToast.error({ title: 'Erro ao atualizar step', description: error.message });
    },
  });
}

export function useCreateAVSubstep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, ...substep }: Partial<AVProjectSubstep> & { projectId: string; step_id: string; title: string }) => {
      const { data, error } = await supabase
        .from('av_project_substeps')
        .insert([substep])
        .select()
        .single();

      if (error) throw error;
      return { ...data, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.steps(data.projectId) });
      enhancedToast.success({ title: 'Subtarefa adicionada' });
    },
    onError: (error) => {
      enhancedToast.error({ title: 'Erro ao criar subtarefa', description: error.message });
    },
  });
}

export function useUpdateAVSubstep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId, ...updates }: Partial<AVProjectSubstep> & { id: string; projectId: string }) => {
      const { data, error } = await supabase
        .from('av_project_substeps')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.steps(data.projectId) });
    },
    onError: (error) => {
      enhancedToast.error({ title: 'Erro ao atualizar subtarefa', description: error.message });
    },
  });
}

export function useDeleteAVSubstep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('av_project_substeps')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.steps(data.projectId) });
      enhancedToast.success({ title: 'Subtarefa removida' });
    },
    onError: (error) => {
      enhancedToast.error({ title: 'Erro ao remover subtarefa', description: error.message });
    },
  });
}
