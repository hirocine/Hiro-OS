export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';
export type SubtitlePosition = 'top' | 'middle' | 'bottom';
export type FontWeight = 'normal' | 'bold';

export type SupportedLanguage =
  | 'pt-BR'
  | 'pt-PT'
  | 'en'
  | 'es'
  | 'fr'
  | 'it'
  | 'de'
  | 'ja';

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  'pt-BR': 'Português (Brasil)',
  'pt-PT': 'Português (Portugal)',
  'en': 'English',
  'es': 'Español',
  'fr': 'Français',
  'it': 'Italiano',
  'de': 'Deutsch',
  'ja': '日本語',
};

export const ASPECT_LABELS: Record<AspectRatio, string> = {
  '16:9': 'Horizontal · 16:9',
  '9:16': 'Vertical · 9:16',
  '1:1': 'Quadrado · 1:1',
  '4:5': 'Retrato · 4:5',
};

export const ASPECT_HINTS: Record<AspectRatio, string> = {
  '16:9': 'YouTube, TV, web',
  '9:16': 'Reels, Shorts, TikTok',
  '1:1': 'Instagram Post',
  '4:5': 'Instagram Feed',
};

export const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Roboto',
  'Inter',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Georgia',
  'Times New Roman',
  'Courier New',
] as const;

export interface SubtitleStyle {
  aspect_ratio: AspectRatio;
  max_lines: number;
  chars_per_line: number;
  position: SubtitlePosition;
  font_family: string;
  font_size: number;
  font_weight: FontWeight;
  text_color: string;
  background_color: string | null;
  background_opacity: number;
  outline_color: string | null;
  outline_width: number;
}

export interface SubtitlePreset extends SubtitleStyle {
  id: string;
  user_id: string | null;
  name: string;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

export interface SrtCue {
  index: number;
  startMs: number;
  endMs: number;
  startStr: string;
  endStr: string;
  text: string;
}

export interface CorrectionConfig {
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  style: SubtitleStyle;
  glossary: string[];
}

export type ExportFormat = 'srt' | 'srt-html' | 'ass';

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  'srt': 'SRT (texto puro)',
  'srt-html': 'SRT com tags HTML (cor)',
  'ass': 'ASS (estilo completo)',
};

export const EXPORT_FORMAT_HINTS: Record<ExportFormat, string> = {
  'srt': 'Compatível com tudo. Só timecode + texto.',
  'srt-html': 'DaVinci aceita cor via <font>. Sem fonte/posição.',
  'ass': 'Estilo completo (fonte, cor, outline, posição). Use no Resolve.',
};
