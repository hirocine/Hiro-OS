import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SubtitlePreset, SubtitleStyle, AspectRatio } from '../types';

const QUERY_KEY = ['subtitle_presets'] as const;

export function useSubtitlePresets() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subtitle_presets')
        .select('*')
        .order('is_global', { ascending: false })
        .order('aspect_ratio', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as SubtitlePreset[];
    },
  });
}

export function useCreatePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; style: SubtitleStyle }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const payload = {
        user_id: user.id,
        name: input.name,
        is_global: false,
        ...input.style,
      };
      const { data, error } = await supabase
        .from('subtitle_presets')
        .insert(payload as never)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as SubtitlePreset;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdatePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name?: string; style?: Partial<SubtitleStyle> }) => {
      const payload: Record<string, unknown> = {};
      if (input.name) payload.name = input.name;
      if (input.style) Object.assign(payload, input.style);
      const { data, error } = await supabase
        .from('subtitle_presets')
        .update(payload as never)
        .eq('id', input.id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as SubtitlePreset;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeletePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('subtitle_presets').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function presetToStyle(p: SubtitlePreset): SubtitleStyle {
  return {
    aspect_ratio: p.aspect_ratio,
    max_lines: p.max_lines,
    chars_per_line: p.chars_per_line,
    position: p.position,
    font_family: p.font_family,
    font_size: p.font_size,
    font_weight: p.font_weight,
    text_color: p.text_color,
    background_color: p.background_color,
    background_opacity: p.background_opacity,
    outline_color: p.outline_color,
    outline_width: p.outline_width,
  };
}

export function defaultStyleForAspect(aspect: AspectRatio): SubtitleStyle {
  if (aspect === '9:16') {
    return {
      aspect_ratio: aspect,
      max_lines: 2,
      chars_per_line: 28,
      position: 'middle',
      font_family: 'Arial',
      font_size: 36,
      font_weight: 'bold',
      text_color: '#FFFFFF',
      background_color: null,
      background_opacity: 0,
      outline_color: '#000000',
      outline_width: 4,
    };
  }
  if (aspect === '1:1') {
    return {
      aspect_ratio: aspect,
      max_lines: 2,
      chars_per_line: 32,
      position: 'bottom',
      font_family: 'Helvetica',
      font_size: 30,
      font_weight: 'bold',
      text_color: '#FFFFFF',
      background_color: null,
      background_opacity: 0,
      outline_color: '#000000',
      outline_width: 3,
    };
  }
  if (aspect === '4:5') {
    return {
      aspect_ratio: aspect,
      max_lines: 2,
      chars_per_line: 30,
      position: 'bottom',
      font_family: 'Helvetica',
      font_size: 28,
      font_weight: 'bold',
      text_color: '#FFFFFF',
      background_color: null,
      background_opacity: 0,
      outline_color: '#000000',
      outline_width: 3,
    };
  }
  return {
    aspect_ratio: '16:9',
    max_lines: 2,
    chars_per_line: 42,
    position: 'bottom',
    font_family: 'Arial',
    font_size: 28,
    font_weight: 'bold',
    text_color: '#FFFFFF',
    background_color: null,
    background_opacity: 0,
    outline_color: '#000000',
    outline_width: 2,
  };
}
