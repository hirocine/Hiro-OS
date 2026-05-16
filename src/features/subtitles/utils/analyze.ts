import type { SrtCue } from '../types';

export interface CueStats {
  durationSec: number;
  charCount: number;
  cps: number;
  lineCount: number;
  longestLineChars: number;
  isEmpty: boolean;
}

export function cueStats(cue: SrtCue): CueStats {
  const text = cue.text ?? '';
  const lines = text.split('\n');
  const charCount = text.replace(/\n/g, '').length;
  const durationMs = Math.max(1, cue.endMs - cue.startMs);
  const durationSec = durationMs / 1000;
  return {
    durationSec,
    charCount,
    cps: charCount / durationSec,
    lineCount: lines.length,
    longestLineChars: Math.max(...lines.map((l) => l.length), 0),
    isEmpty: text.trim().length === 0,
  };
}

export interface SrtSummary {
  cueCount: number;
  totalDurationMs: number;
  durationLabel: string;
  wordCount: number;
  charCount: number;
  avgCps: number;
  peakCps: number;
  peakCpsCueIndex: number | null;
  emptyCueCount: number;
  emptyCueIndices: number[];
  longLineCount: number;
  longLineIndices: number[];
  highCpsCount: number;
  highCpsIndices: number[];
  parseTimeMs: number | null;
}

export function summarizeSrt(cues: SrtCue[], opts: { maxCharsPerLine: number; cpsMax: number; parseTimeMs?: number | null }): SrtSummary {
  if (cues.length === 0) {
    return {
      cueCount: 0,
      totalDurationMs: 0,
      durationLabel: '0:00',
      wordCount: 0,
      charCount: 0,
      avgCps: 0,
      peakCps: 0,
      peakCpsCueIndex: null,
      emptyCueCount: 0,
      emptyCueIndices: [],
      longLineCount: 0,
      longLineIndices: [],
      highCpsCount: 0,
      highCpsIndices: [],
      parseTimeMs: opts.parseTimeMs ?? null,
    };
  }

  const start = cues[0].startMs;
  const end = cues[cues.length - 1].endMs;
  const totalDurationMs = Math.max(0, end - start);

  let wordCount = 0;
  let charCount = 0;
  let weightedCpsNumerator = 0;
  let weightedCpsDenominator = 0;
  let peakCps = 0;
  let peakCpsCueIndex: number | null = null;
  const emptyCueIndices: number[] = [];
  const longLineIndices: number[] = [];
  const highCpsIndices: number[] = [];

  for (const cue of cues) {
    const stats = cueStats(cue);
    if (stats.isEmpty) {
      emptyCueIndices.push(cue.index);
      continue;
    }
    const words = cue.text.split(/\s+/).filter(Boolean);
    wordCount += words.length;
    charCount += stats.charCount;
    weightedCpsNumerator += stats.charCount;
    weightedCpsDenominator += stats.durationSec;
    if (stats.cps > peakCps) {
      peakCps = stats.cps;
      peakCpsCueIndex = cue.index;
    }
    if (stats.cps > opts.cpsMax) highCpsIndices.push(cue.index);
    if (stats.longestLineChars > opts.maxCharsPerLine) longLineIndices.push(cue.index);
  }

  const avgCps = weightedCpsDenominator > 0 ? weightedCpsNumerator / weightedCpsDenominator : 0;
  const m = Math.floor(totalDurationMs / 60000);
  const s = Math.floor((totalDurationMs % 60000) / 1000);
  const durationLabel = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  return {
    cueCount: cues.length,
    totalDurationMs,
    durationLabel,
    wordCount,
    charCount,
    avgCps,
    peakCps,
    peakCpsCueIndex,
    emptyCueCount: emptyCueIndices.length,
    emptyCueIndices,
    longLineCount: longLineIndices.length,
    longLineIndices,
    highCpsCount: highCpsIndices.length,
    highCpsIndices,
    parseTimeMs: opts.parseTimeMs ?? null,
  };
}

export type ChangeTag = 'pontuacao' | 'quebra' | 'casing' | 'glossario' | 'acentos' | 'cps' | 'removida';

export const CHANGE_TAG_LABELS: Record<ChangeTag, string> = {
  pontuacao: 'Pontuação',
  quebra: 'Quebra de linha',
  casing: 'Casing',
  glossario: 'Glossário',
  acentos: 'Acentos',
  cps: 'CPS reduzido',
  removida: 'Cue removida',
};

export const CHANGE_TAG_COLORS: Record<ChangeTag, { fg: string; bg: string }> = {
  pontuacao: { fg: 'hsl(var(--ds-info))', bg: 'hsl(var(--ds-info) / 0.1)' },
  quebra: { fg: 'hsl(var(--ds-accent-deep))', bg: 'hsl(var(--ds-accent-soft))' },
  casing: { fg: 'hsl(280 50% 40%)', bg: 'hsl(280 50% 95%)' },
  glossario: { fg: 'hsl(var(--ds-accent-deep))', bg: 'hsl(var(--ds-accent-soft))' },
  acentos: { fg: 'hsl(var(--ds-warn))', bg: 'hsl(43 89% 92%)' },
  cps: { fg: 'hsl(var(--ds-warn))', bg: 'hsl(43 89% 92%)' },
  removida: { fg: 'hsl(var(--ds-danger))', bg: 'hsl(0 60% 95%)' },
};

const PUNCT = /[.,!?;:…—–-]/;
const ACCENTED = /[áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ]/;

function strip(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function removeAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function classifyChange(before: string, after: string, glossary: string[] = [], cpsBefore?: number, cpsAfter?: number): ChangeTag[] {
  const tags = new Set<ChangeTag>();
  const b = strip(before);
  const a = strip(after);

  if (a === '' && b !== '') {
    tags.add('removida');
    return Array.from(tags);
  }

  // Linha break diff
  const beforeLines = before.split('\n').length;
  const afterLines = after.split('\n').length;
  if (beforeLines !== afterLines) tags.add('quebra');

  // Pontuação: contar pontuação antes e depois
  const beforePunct = (b.match(new RegExp(PUNCT.source, 'g')) || []).length;
  const afterPunct = (a.match(new RegExp(PUNCT.source, 'g')) || []).length;
  if (beforePunct !== afterPunct) tags.add('pontuacao');

  // Casing: comparar lowercase normalized — se igual, mas case difere, é casing
  const bLow = b.toLowerCase();
  const aLow = a.toLowerCase();
  if (b !== a && removeAccents(bLow) === removeAccents(aLow) && bLow !== aLow) {
    tags.add('casing');
  } else if (b !== a) {
    // Find any uppercase change
    const bUpperCount = (b.match(/[A-ZÀ-ſ]/g) || []).length;
    const aUpperCount = (a.match(/[A-ZÀ-ſ]/g) || []).length;
    if (bUpperCount !== aUpperCount) tags.add('casing');
  }

  // Acentos: comparar sem acento — se igual, diff é só acentos
  if (removeAccents(b.toLowerCase()) === removeAccents(a.toLowerCase()) && (ACCENTED.test(a) || ACCENTED.test(b)) && b.toLowerCase() !== a.toLowerCase()) {
    tags.add('acentos');
  } else {
    // Diff palavra-a-palavra pra detectar mudança específica de acento
    const beforeWords = b.toLowerCase().split(/\s+/);
    const afterWords = a.toLowerCase().split(/\s+/);
    if (beforeWords.length === afterWords.length) {
      for (let i = 0; i < beforeWords.length; i++) {
        const bw = beforeWords[i];
        const aw = afterWords[i];
        if (bw !== aw && removeAccents(bw) === removeAccents(aw)) {
          tags.add('acentos');
          break;
        }
      }
    }
  }

  // Glossário: termo do glossário aparece com casing/spelling diferente no antes vs depois
  for (const term of glossary) {
    if (!term) continue;
    const tLow = term.toLowerCase();
    if (a.toLowerCase().includes(tLow) && !b.includes(term)) {
      tags.add('glossario');
      break;
    }
  }

  // CPS: se temos os dois valores e o depois é significativamente menor
  if (cpsBefore !== undefined && cpsAfter !== undefined && cpsBefore - cpsAfter > 1.5) {
    tags.add('cps');
  }

  return Array.from(tags);
}

export function estimateCost(cues: SrtCue[]): { tokens: number; cost: number } {
  const charCount = cues.reduce((sum, c) => sum + c.text.length, 0);
  const inputTokens = Math.ceil(charCount / 4) + 500;
  const outputTokens = Math.ceil(charCount / 4) + 200;
  // claude-sonnet-4-5: ~$3/1M input, ~$15/1M output
  const cost = (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;
  return { tokens: inputTokens + outputTokens, cost };
}

export function estimateTime(cues: SrtCue[]): number {
  // ~1s per 6 cues, min 5s
  return Math.max(5, Math.ceil(cues.length / 6));
}
