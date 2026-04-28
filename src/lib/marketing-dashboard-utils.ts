import { type PeriodPreset, type PeriodDateRange } from '@/components/Marketing/PeriodPicker';

// ============================================
// Constants
// ============================================
export const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#ec4899',
  youtube: '#ef4444',
  tiktok: '#0a0a0a',
  linkedin: '#0a66c2',
  other: '#6b7280',
};

const GENDER_COLORS: Record<string, string> = {
  F: '#ec4899',
  M: '#3b82f6',
  U: '#94a3b8',
};

const AGE_ORDER = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

// ============================================
// Types
// ============================================
export interface DailySnapshot {
  date: string; // yyyy-mm-dd
  views: number;
}

export interface DateRange {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
}

// ============================================
// Functions
// ============================================
export function resolvePeriod(
  preset: PeriodPreset,
  customRange: PeriodDateRange | null
): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (preset === 'custom' && customRange) {
    const s = new Date(customRange.start);
    s.setHours(0, 0, 0, 0);
    const e = new Date(customRange.end);
    e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
  }

  if (preset === 'all') {
    return { start: new Date(0), end };
  }

  if (preset === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start, end };
  }

  if (preset === 'last_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    lastDayOfPrevMonth.setHours(23, 59, 59, 999);
    return { start, end: lastDayOfPrevMonth };
  }

  const days = Number(preset);
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export function resolvePrevRange(curr: { start: Date; end: Date }) {
  const ms = curr.end.getTime() - curr.start.getTime();
  const prevEnd = new Date(curr.start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - ms);
  return { prevStart, prevEnd };
}

export function inRange(d: Date | null, r: { start: Date; end: Date }) {
  if (!d) return false;
  const t = d.getTime();
  return t >= r.start.getTime() && t <= r.end.getTime();
}

export function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return curr > 0 ? 100 : null;
  return ((curr - prev) / prev) * 100;
}

export function formatTimeAgo(iso: string | null | undefined): { text: string; tone: 'ok' | 'warn' | 'idle' } {
  if (!iso) return { text: 'Aguardando primeira sincronização', tone: 'idle' };
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return { text: 'há poucos minutos', tone: 'ok' };
  if (hours < 24) return { text: `há ${hours}h`, tone: 'ok' };
  const days = Math.floor(hours / 24);
  return { text: `há ${days} ${days === 1 ? 'dia' : 'dias'}`, tone: hours > 36 ? 'warn' : 'ok' };
}

export function fmtChartDate(v: string) {
  return new Date(v + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

export function genderColor(key: string): string {
  const prefix = key.split('.')[0]?.toUpperCase() ?? 'U';
  return GENDER_COLORS[prefix] ?? GENDER_COLORS.U;
}

export function topEntries(obj: Record<string, number> | null | undefined, n: number) {
  if (!obj) return [] as Array<{ key: string; value: number; pct: number }>;
  const entries = Object.entries(obj)
    .map(([key, value]) => ({ key, value: Number(value) || 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
  const total = entries.reduce((s, e) => s + e.value, 0);
  return entries.map((e) => ({ ...e, pct: total > 0 ? (e.value / total) * 100 : 0 }));
}

// Separa as chaves prefixadas (`age:`, `gender:`) em buckets distintos
export function splitGenderAge(obj: Record<string, number> | null | undefined) {
  const ages: Record<string, number> = {};
  const genders: Record<string, number> = {};
  if (!obj) return { ages, genders };
  for (const [key, value] of Object.entries(obj)) {
    const v = Number(value) || 0;
    if (key.startsWith('age:')) {
      ages[key.replace('age:', '')] = v;
    } else if (key.startsWith('gender:')) {
      genders[key.replace('gender:', '')] = v;
    }
  }
  return { ages, genders };
}

export function ageEntries(ages: Record<string, number>) {
  const total = Object.values(ages).reduce((s, v) => s + v, 0);
  if (total === 0) return [] as Array<{ key: string; value: number; pct: number }>;
  return AGE_ORDER.filter((age) => ages[age] !== undefined).map((age) => ({
    key: age,
    value: ages[age],
    pct: (ages[age] / total) * 100,
  }));
}

export function genderEntries(genders: Record<string, number>) {
  const total = Object.values(genders).reduce((s, v) => s + v, 0);
  if (total === 0) return [] as Array<{ key: string; value: number; pct: number; label: string; color: string }>;
  const LABEL: Record<string, string> = { F: 'Mulheres', M: 'Homens', U: 'Outros' };
  return Object.entries(genders)
    .map(([key, value]) => {
      const k = key.toUpperCase();
      return {
        key: k,
        value,
        pct: (value / total) * 100,
        label: LABEL[k] ?? key,
        color: GENDER_COLORS[k] ?? GENDER_COLORS.U,
      };
    })
    .sort((a, b) => b.value - a.value);
}

export function localeFlag(locale: string): string {
  const map: Record<string, string> = {
    pt_BR: '🇧🇷', pt_PT: '🇵🇹',
    en_US: '🇺🇸', en_GB: '🇬🇧',
    es_ES: '🇪🇸', es_MX: '🇲🇽',
    fr_FR: '🇫🇷', it_IT: '🇮🇹',
    de_DE: '🇩🇪', ja_JP: '🇯🇵',
    zh_CN: '🇨🇳', ko_KR: '🇰🇷',
  };
  return map[locale] ?? map[locale.replace('-', '_')] ?? '🌐';
}

export function localeLabel(locale: string): string {
  const map: Record<string, string> = {
    pt_BR: 'Português (BR)',
    pt_PT: 'Português (PT)',
    en_US: 'Inglês (US)',
    en_GB: 'Inglês (UK)',
    es_ES: 'Espanhol (ES)',
    es_MX: 'Espanhol (MX)',
    fr_FR: 'Francês',
    it_IT: 'Italiano',
    de_DE: 'Alemão',
    ja_JP: 'Japonês',
    zh_CN: 'Chinês',
    ko_KR: 'Coreano',
  };
  return map[locale] ?? map[locale.replace('-', '_')] ?? locale;
}
