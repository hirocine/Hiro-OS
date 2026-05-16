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
  // Aplica os FIXED_STYLE pra ignorar valores antigos de cor/fundo/outline
  // que possam existir em presets criados antes da simplificação.
  return {
    aspect_ratio: p.aspect_ratio,
    max_lines: p.max_lines,
    chars_per_line: p.chars_per_line,
    cps_max: p.cps_max ?? 17,
    position: p.position,
    margin_v: p.margin_v ?? 9,
    font_size: p.font_size,
    tracking: p.tracking ?? 0,
    casing: p.casing ?? 'sentence',
    max_width: p.max_width ?? 88,
    tone: p.tone ?? 'editorial',
    ...FIXED_STYLE,
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

// Fixed style values — não configurável via UI, sempre Helvetica Now Display Bold em branco.
const FIXED_STYLE = {
  font_family: 'HN Display',
  font_weight: 'bold' as const,
  text_color: '#FFFFFF',
  bg_type: 'none' as const,
  background_color: null,
  background_opacity: 0,
  padding_v: 0,
  padding_h: 0,
  outline_color: null,
  outline_width: 0,
  shadow_enabled: false,
  shadow_x: 0,
  shadow_y: 0,
  shadow_blur: 0,
  shadow_color: '#000000',
};

export function defaultStyleForAspect(aspect: AspectRatio): SubtitleStyle {
  const base = {
    ...FIXED_STYLE,
    margin_v: 9,
    tracking: 0,
    casing: 'sentence' as const,
    max_width: 88,
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
      font_size: 36,
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
      font_size: 30,
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
      font_size: 28,
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
      font_size: 30,
    };
  }
  return {
    ...base,
    aspect_ratio: '16:9',
    max_lines: 2,
    chars_per_line: 38,
    cps_max: 17,
    position: 'bottom',
    font_size: 28,
  };
}

// Garante que styles carregados de presets antigos (com cor/fundo/outline) virem os defaults fixos.
export function normalizeStyle(style: SubtitleStyle): SubtitleStyle {
  return { ...style, ...FIXED_STYLE };
}
