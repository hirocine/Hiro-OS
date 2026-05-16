import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SubtitleStyle, SupportedLanguage } from '../types';

interface CorrectInput {
  srt: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  style: SubtitleStyle;
  glossary: string[];
}

interface CorrectResponse {
  srt: string;
}

export function useCorrectSubtitle() {
  return useMutation({
    mutationFn: async (input: CorrectInput) => {
      const { data, error } = await supabase.functions.invoke<CorrectResponse>('correct-subtitle', {
        body: {
          srt: input.srt,
          aspectRatio: input.style.aspect_ratio,
          sourceLanguage: input.sourceLanguage,
          targetLanguage: input.targetLanguage,
          maxCharsPerLine: input.style.chars_per_line,
          maxLines: input.style.max_lines,
          glossary: input.glossary,
        },
      });
      if (error) throw error;
      if (!data?.srt) throw new Error('Resposta sem SRT');
      return data.srt;
    },
  });
}
