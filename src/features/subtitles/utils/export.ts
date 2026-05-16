import type { SrtCue, SubtitleStyle, ExportFormat } from '../types';
import { stringifySrt } from './parseSrt';

function hexToAssBgr(hex: string, alpha = 0): string {
  const h = hex.replace('#', '');
  const r = h.slice(0, 2);
  const g = h.slice(2, 4);
  const b = h.slice(4, 6);
  const a = Math.round((1 - alpha) * 255)
    .toString(16)
    .padStart(2, '0');
  return `&H${a}${b}${g}${r}`.toUpperCase();
}

function srtTimeToAss(srtTime: string): string {
  // 00:00:01,500 -> 0:00:01.50
  const m = srtTime.match(/^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})$/);
  if (!m) return '0:00:00.00';
  const [, hh, mm, ss, ms] = m;
  const centi = String(Math.floor(Number(ms.padEnd(3, '0')) / 10)).padStart(2, '0');
  return `${Number(hh)}:${mm}:${ss}.${centi}`;
}

function assAlignmentFor(position: SubtitleStyle['position']): number {
  if (position === 'top') return 8;
  if (position === 'middle') return 5;
  return 2;
}

export function exportSrtPlain(cues: SrtCue[]): string {
  return stringifySrt(cues);
}

export function exportSrtHtml(cues: SrtCue[], style: SubtitleStyle): string {
  if (style.text_color === '#FFFFFF') return stringifySrt(cues);
  const styled = cues.map((c) => ({
    ...c,
    text: `<font color="${style.text_color}">${c.text.split('\n').join('</font>\n<font color="' + style.text_color + '">')}</font>`,
  }));
  return stringifySrt(styled);
}

export function exportAss(cues: SrtCue[], style: SubtitleStyle): string {
  const playRes = (() => {
    if (style.aspect_ratio === '9:16') return { x: 1080, y: 1920 };
    if (style.aspect_ratio === '1:1') return { x: 1080, y: 1080 };
    if (style.aspect_ratio === '4:5') return { x: 1080, y: 1350 };
    return { x: 1920, y: 1080 };
  })();

  const primary = hexToAssBgr(style.text_color, 0);
  const outline = style.outline_color ? hexToAssBgr(style.outline_color, 0) : hexToAssBgr('#000000', 0);
  const back = style.background_color
    ? hexToAssBgr(style.background_color, 1 - style.background_opacity)
    : hexToAssBgr('#000000', 1);
  const borderStyle = style.background_color && style.background_opacity > 0 ? 3 : 1;
  const bold = style.font_weight === 'bold' ? -1 : 0;
  const alignment = assAlignmentFor(style.position);

  const header = `[Script Info]
Title: Hiro OS · Correção de Legendas
ScriptType: v4.00+
PlayResX: ${playRes.x}
PlayResY: ${playRes.y}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style.font_family},${style.font_size * (playRes.y / 1080)},${primary},${primary},${outline},${back},${bold},0,0,0,100,100,0,0,${borderStyle},${style.outline_width},0,${alignment},20,20,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = cues
    .map((c) => {
      const text = c.text.replace(/\n/g, '\\N');
      return `Dialogue: 0,${srtTimeToAss(c.startStr)},${srtTimeToAss(c.endStr)},Default,,0,0,0,,${text}`;
    })
    .join('\n');

  return header + events + '\n';
}

export function exportCues(cues: SrtCue[], style: SubtitleStyle, format: ExportFormat): { content: string; filename: string; mime: string } {
  const ts = new Date().toISOString().slice(0, 10);
  if (format === 'ass') {
    return {
      content: exportAss(cues, style),
      filename: `legenda-${ts}.ass`,
      mime: 'text/plain;charset=utf-8',
    };
  }
  if (format === 'srt-html') {
    return {
      content: exportSrtHtml(cues, style),
      filename: `legenda-${ts}.srt`,
      mime: 'application/x-subrip;charset=utf-8',
    };
  }
  return {
    content: exportSrtPlain(cues),
    filename: `legenda-${ts}.srt`,
    mime: 'application/x-subrip;charset=utf-8',
  };
}

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
