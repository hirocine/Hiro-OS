export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '2.39:1';
export type SubtitlePosition = 'top' | 'middle' | 'bottom';
export type FontWeight = 'normal' | 'bold';
export type Casing = 'sentence' | 'literal' | 'upper';
export type BgType = 'none' | 'box' | 'strip';
export type Tone = 'editorial' | 'neutral' | 'casual' | 'literal';

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
  '2.39:1': 'Cinema · 2.39:1',
};

export const ASPECT_HINTS: Record<AspectRatio, string> = {
  '16:9': 'YouTube · TV · Web',
  '9:16': 'Reels · TikTok',
  '1:1': 'Feed Instagram',
  '4:5': 'Instagram Feed alto',
  '2.39:1': 'Anamórfico',
};

export const ASPECT_RESOLUTION: Record<AspectRatio, string> = {
  '16:9': '1920 × 1080',
  '9:16': '1080 × 1920',
  '1:1': '1080 × 1080',
  '4:5': '1080 × 1350',
  '2.39:1': '2048 × 858',
};

export const TONE_LABELS: Record<Tone, string> = {
  editorial: 'Editorial',
  neutral: 'Neutro',
  casual: 'Informal · falado',
  literal: 'Literal · transcrição',
};

export const CASING_LABELS: Record<Casing, string> = {
  sentence: 'Sentence',
  literal: 'Literal',
  upper: 'CAIXA',
};

export const BG_TYPE_LABELS: Record<BgType, string> = {
  none: 'Nenhum',
  box: 'Caixa',
  strip: 'Faixa',
};

export const FONT_FAMILIES = [
  'HN Display',
  'HN Text',
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
  cps_max: number;
  position: SubtitlePosition;
  margin_v: number;
  font_family: string;
  font_size: number;
  font_weight: FontWeight;
  tracking: number;
  casing: Casing;
  text_color: string;
  bg_type: BgType;
  background_color: string | null;
  background_opacity: number;
  padding_v: number;
  padding_h: number;
  max_width: number;
  outline_color: string | null;
  outline_width: number;
  shadow_enabled: boolean;
  shadow_x: number;
  shadow_y: number;
  shadow_blur: number;
  shadow_color: string;
  tone: Tone;
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

export type ExportFormat = 'srt' | 'srt-html' | 'vtt' | 'ass' | 'csv' | 'txt';

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  'srt': 'SubRip',
  'srt-html': 'SubRip + HTML',
  'vtt': 'WebVTT',
  'ass': 'Advanced SSA',
  'csv': 'Planilha',
  'txt': 'Texto puro',
};

export const EXPORT_FORMAT_EXTENSIONS: Record<ExportFormat, string> = {
  'srt': 'srt',
  'srt-html': 'srt',
  'vtt': 'vtt',
  'ass': 'ass',
  'csv': 'csv',
  'txt': 'txt',
};

export const EXPORT_FORMAT_HINTS: Record<ExportFormat, string> = {
  'srt': 'Padrão universal. Texto + timecode. Sem estilos.',
  'srt-html': 'SRT com tags HTML pra cor (suportado pelo DaVinci).',
  'vtt': 'Player HTML5. Suporta estilo básico via CSS.',
  'ass': 'Mantém fonte, cor, contorno e posição configurados.',
  'csv': 'Pra revisar texto numa planilha (cliente, tradução).',
  'txt': 'Roteiro corrido, sem timecode. Pra copy/revisão.',
};

export const EXPORT_FORMAT_BADGES: Record<ExportFormat, { label: string; tone: 'acc' | 'warn' | 'neutral' }> = {
  'srt': { label: 'Recomendado', tone: 'acc' },
  'srt-html': { label: 'Cor', tone: 'neutral' },
  'vtt': { label: 'Web', tone: 'neutral' },
  'ass': { label: 'Com estilo', tone: 'neutral' },
  'csv': { label: 'Tabular', tone: 'neutral' },
  'txt': { label: 'Roteiro', tone: 'neutral' },
};

export const EXPORT_FORMAT_COMPAT: Record<ExportFormat, string[]> = {
  'srt': ['DaVinci', 'Premiere', 'YouTube'],
  'srt-html': ['DaVinci', 'VLC'],
  'vtt': ['HTML5', 'Vimeo', 'Brightcove'],
  'ass': ['DaVinci', 'Aegisub', 'VLC'],
  'csv': ['Excel', 'Sheets', 'Numbers'],
  'txt': ['Notion', 'Drive'],
};
