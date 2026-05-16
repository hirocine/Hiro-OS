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
    cps_max: p.cps_max ?? 17,
    position: p.position,
    margin_v: p.margin_v ?? 9,
    font_family: p.font_family,
    font_size: p.font_size,
    font_weight: p.font_weight,
    tracking: p.tracking ?? 0,
    casing: p.casing ?? 'sentence',
    text_color: p.text_color,
    bg_type: p.bg_type ?? 'box',
    background_color: p.background_color,
    background_opacity: p.background_opacity,
    padding_v: p.padding_v ?? 4,
    padding_h: p.padding_h ?? 12,
    max_width: p.max_width ?? 88,
    outline_color: p.outline_color,
    outline_width: p.outline_width,
    shadow_enabled: p.shadow_enabled ?? false,
    shadow_x: p.shadow_x ?? 0,
    shadow_y: p.shadow_y ?? 0,
    shadow_blur: p.shadow_blur ?? 0,
    shadow_color: p.shadow_color ?? '#000000',
    tone: p.tone ?? 'editorial',
  };
}

export function stylesEqual(a: SubtitleStyle, b: SubtitleStyle): boolean {
  const keys: (keyof SubtitleStyle)[] = [
    'aspect_ratio', 'max_lines', 'chars_per_line', 'cps_max', 'position', 'margin_v',
    'font_family', 'font_size', 'font_weight', 'tracking', 'casing',
    'text_color', 'bg_type', 'background_color', 'background_opacity',
    'padding_v', 'padding_h', 'max_width',
    'outline_color', 'outline_width',
    'shadow_enabled', 'shadow_x', 'shadow_y', 'shadow_blur', 'shadow_color',
    'tone',
  ];
  for (const k of keys) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

export function defaultStyleForAspect(aspect: AspectRatio): SubtitleStyle {
  const base = {
    margin_v: 9,
    tracking: 0,
    casing: 'sentence' as const,
    bg_type: 'box' as const,
    padding_v: 4,
    padding_h: 12,
    max_width: 88,
    shadow_enabled: false,
    shadow_x: 0,
    shadow_y: 0,
    shadow_blur: 0,
    shadow_color: '#000000',
    tone: 'editorial' as const,
  };

  if (aspect === '9:16') {
    return {
      ...base,
      aspect_ratio: aspect,
      max_lines: 2,
      chars_per_line: 28,
      cps_max: 15,
      position: 'middle',
      font_family: 'HN Display',
      font_size: 36,
      font_weight: 'bold',
      text_color: '#FFFFFF',
      background_color: null,
      background_opacity: 0,
      bg_type: 'none',
      outline_color: '#000000',
      outline_width: 4,
    };
  }
  if (aspect === '1:1') {
    return {
      ...base,
      aspect_ratio: aspect,
      max_lines: 2,
      chars_per_line: 32,
      cps_max: 16,
      position: 'bottom',
      font_family: 'HN Display',
      font_size: 30,
      font_weight: 'bold',
      text_color: '#FFFFFF',
      background_color: '#0A0A0A',
      background_opacity: 0.6,
      bg_type: 'box',
      outline_color: '#000000',
      outline_width: 0,
    };
  }
  if (aspect === '4:5') {
    return {
      ...base,
      aspect_ratio: aspect,
      max_lines: 2,
      chars_per_line: 30,
      cps_max: 16,
      position: 'bottom',
      font_family: 'HN Display',
      font_size: 28,
      font_weight: 'bold',
      text_color: '#FFFFFF',
      background_color: '#0A0A0A',
      background_opacity: 0.6,
      bg_type: 'box',
      outline_color: '#000000',
      outline_width: 0,
    };
  }
  if (aspect === '2.39:1') {
    return {
      ...base,
      aspect_ratio: aspect,
      max_lines: 2,
      chars_per_line: 42,
      cps_max: 17,
      position: 'bottom',
      font_family: 'HN Display',
      font_size: 30,
      font_weight: 'normal',
      text_color: '#FFFFFF',
      background_color: null,
      background_opacity: 0,
      bg_type: 'none',
      outline_color: '#000000',
      outline_width: 3,
    };
  }
  return {
    ...base,
    aspect_ratio: '16:9',
    max_lines: 2,
    chars_per_line: 38,
    cps_max: 17,
    position: 'bottom',
    font_family: 'HN Display',
    font_size: 24,
    font_weight: 'normal',
    text_color: '#FFFFFF',
    background_color: '#0A0A0A',
    background_opacity: 0.6,
    bg_type: 'box',
    outline_color: '#000000',
    outline_width: 0,
  };
}
