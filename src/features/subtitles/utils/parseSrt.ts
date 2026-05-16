import type { SrtCue } from '../types';

function parseTimestamp(s: string): number {
  const m = s.match(/^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})$/);
  if (!m) return 0;
  const [, hh, mm, ss, ms] = m;
  return (
    Number(hh) * 3600_000 +
    Number(mm) * 60_000 +
    Number(ss) * 1000 +
    Number(ms.padEnd(3, '0'))
  );
}

export function parseSrt(srt: string): SrtCue[] {
  if (!srt?.trim()) return [];
  const blocks = srt.replace(/\r\n/g, '\n').split(/\n\s*\n/);
  const cues: SrtCue[] = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    let i = 0;
    let index = cues.length + 1;
    if (/^\d+$/.test(lines[0]?.trim() ?? '')) {
      index = Number(lines[0]);
      i = 1;
    }

    const timing = lines[i]?.trim();
    if (!timing) continue;
    const tm = timing.match(/(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})/);
    if (!tm) continue;

    const text = lines.slice(i + 1).join('\n').trim();
    if (!text) continue;

    cues.push({
      index,
      startMs: parseTimestamp(tm[1]),
      endMs: parseTimestamp(tm[2]),
      startStr: tm[1],
      endStr: tm[2],
      text,
    });
  }

  return cues;
}

export function stringifySrt(cues: SrtCue[]): string {
  return cues
    .map((c) => `${c.index}\n${c.startStr} --> ${c.endStr}\n${c.text}`)
    .join('\n\n');
}

export function formatMs(ms: number): string {
  const h = Math.floor(ms / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const milli = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(milli).padStart(3, '0')}`;
}
