import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SupportedLanguage, AspectRatio } from '../types';

export type JobStatus = 'uploaded' | 'configured' | 'processed' | 'exported';

export interface SubtitleJob {
  id: string;
  user_id: string;
  file_name: string;
  file_size_bytes: number;
  cue_count: number;
  source_language: SupportedLanguage;
  target_language: SupportedLanguage;
  aspect_ratio: AspectRatio;
  preset_id: string | null;
  preset_name: string | null;
  status: JobStatus;
  original_srt: string;
  corrected_srt: string | null;
  glossary: string[];
  created_at: string;
  updated_at: string;
}

const QUERY_KEY = ['subtitle_jobs'] as const;

export function useSubtitleJobs(limit = 20) {
  return useQuery({
    queryKey: [...QUERY_KEY, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subtitle_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as SubtitleJob[];
    },
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      file_name: string;
      file_size_bytes: number;
      cue_count: number;
      original_srt: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('subtitle_jobs')
        .insert({
          user_id: user.id,
          file_name: input.file_name,
          file_size_bytes: input.file_size_bytes,
          cue_count: input.cue_count,
          original_srt: input.original_srt,
          status: 'uploaded',
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as SubtitleJob;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; patch: Partial<SubtitleJob> }) => {
      const { data, error } = await supabase
        .from('subtitle_jobs')
        .update(input.patch as never)
        .eq('id', input.id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as SubtitleJob;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('subtitle_jobs').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
