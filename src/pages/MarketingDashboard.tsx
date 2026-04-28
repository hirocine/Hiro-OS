import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer as RechartsContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  ArrowDown,
  ArrowUp,
  Image as ImageIcon,
  Minus,
  AlertTriangle,
  Sparkles,
  Calendar as CalendarIcon,
  BarChart3,
  Trophy,
  Layers,
  CheckCircle,
  PieChart as PieIcon,
  RefreshCw,
  Users,
  Eye,
  FileText,
  Plug,
  Globe,
  MapPin,
  Instagram,
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useMarketingPostMetrics, type PostWithMetrics } from '@/hooks/useMarketingPostMetrics';
import { useMarketingAccountSnapshots } from '@/hooks/useMarketingAccountSnapshots';
import { useMarketingIntegrations } from '@/hooks/useMarketingIntegrations';
import { getPillarColor } from '@/lib/marketing-colors';
import { getPostPlatformLabel, getPostFormatLabel } from '@/lib/marketing-posts-config';
import { supabase } from '@/integrations/supabase/client';

import { PeriodPicker, type PeriodPreset, type PeriodDateRange, PERIOD_OPTIONS } from '@/components/Marketing/PeriodPicker';
import { format as formatDate } from 'date-fns';
import { ptBR as ptBRLocale } from 'date-fns/locale';

function resolvePeriod(
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

function resolvePrevRange(curr: { start: Date; end: Date }) {
  const ms = curr.end.getTime() - curr.start.getTime();
  const prevEnd = new Date(curr.start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - ms);
  return { prevStart, prevEnd };
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#ec4899',
  youtube: '#ef4444',
  tiktok: '#0a0a0a',
  linkedin: '#0a66c2',
  other: '#6b7280',
};

interface DateRange {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
}

// (getRange substituído por resolvePeriod + resolvePrevRange acima)


function inRange(d: Date | null, r: { start: Date; end: Date }) {
  if (!d) return false;
  const t = d.getTime();
  return t >= r.start.getTime() && t <= r.end.getTime();
}

function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return curr > 0 ? 100 : null;
  return ((curr - prev) / prev) * 100;
}

function formatTimeAgo(iso: string | null | undefined): { text: string; tone: 'ok' | 'warn' | 'idle' } {
  if (!iso) return { text: 'Aguardando primeira sincronização', tone: 'idle' };
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return { text: 'há poucos minutos', tone: 'ok' };
  if (hours < 24) return { text: `há ${hours}h`, tone: 'ok' };
  const days = Math.floor(hours / 24);
  return { text: `há ${days} ${days === 1 ? 'dia' : 'dias'}`, tone: hours > 36 ? 'warn' : 'ok' };
}

function ChangeBadge({ value, withContext = true }: { value: number | null; withContext?: boolean }) {
  if (value === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        Sem comparação ainda
      </span>
    );
  }
  const positive = value >= 0;
  const Icon = positive ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        positive ? 'text-emerald-500' : 'text-red-500'
      )}
    >
      <Icon className="h-3 w-3" />
      <span className="font-numeric">{Math.abs(value).toFixed(1)}%</span>
      {withContext && (
        <span className="text-muted-foreground font-normal ml-0.5">vs período anterior</span>
      )}
    </span>
  );
}

function KpiCard({
  label,
  value,
  change,
  emoji,
}: {
  label: string;
  value: string | number;
  change: number | null;
  emoji: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <span>{emoji}</span>
          <span>{label}</span>
        </div>
        <div className="text-3xl font-semibold mt-2 font-numeric">{value}</div>
        <div className="mt-1">
          <ChangeBadge value={change} />
        </div>
      </CardContent>
    </Card>
  );
}

function AccountKpiCard({
  icon: Icon,
  label,
  value,
  subtitle,
  subtone = 'muted',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtitle?: string;
  subtone?: 'muted' | 'positive' | 'negative';
}) {
  return (
    <Card className="shadow-card hover:shadow-elegant transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-3xl sm:text-4xl font-bold font-numeric tracking-tight text-foreground">
          {value}
        </div>
        {subtitle && (
          <p
            className={cn(
              'text-xs font-medium font-numeric',
              subtone === 'positive' && 'text-success',
              subtone === 'negative' && 'text-destructive',
              subtone === 'muted' && 'text-muted-foreground'
            )}
          >
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface DailySnapshot {
  date: string; // yyyy-mm-dd
  views: number;
}

function fmtChartDate(v: string) {
  return new Date(v + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  const val = Number(payload[0]?.value ?? 0);
  const labelStr = label
    ? new Date(String(label) + 'T12:00:00').toLocaleDateString('pt-BR')
    : '';
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-1">{labelStr}</p>
      <p className="text-primary font-medium font-numeric">
        {val.toLocaleString('pt-BR')} {unit}
      </p>
    </div>
  );
}

const GENDER_COLORS: Record<string, string> = {
  F: '#ec4899',
  M: '#3b82f6',
  U: '#94a3b8',
};

function genderColor(key: string): string {
  const prefix = key.split('.')[0]?.toUpperCase() ?? 'U';
  return GENDER_COLORS[prefix] ?? GENDER_COLORS.U;
}

function topEntries(obj: Record<string, number> | null | undefined, n: number) {
  if (!obj) return [] as Array<{ key: string; value: number; pct: number }>;
  const entries = Object.entries(obj)
    .map(([key, value]) => ({ key, value: Number(value) || 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
  const total = entries.reduce((s, e) => s + e.value, 0);
  return entries.map((e) => ({ ...e, pct: total > 0 ? (e.value / total) * 100 : 0 }));
}

// Separa as chaves prefixadas (`age:`, `gender:`) em buckets distintos
function splitGenderAge(obj: Record<string, number> | null | undefined) {
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

const AGE_ORDER = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

function ageEntries(ages: Record<string, number>) {
  const total = Object.values(ages).reduce((s, v) => s + v, 0);
  if (total === 0) return [] as Array<{ key: string; value: number; pct: number }>;
  return AGE_ORDER.filter((age) => ages[age] !== undefined).map((age) => ({
    key: age,
    value: ages[age],
    pct: (ages[age] / total) * 100,
  }));
}

function genderEntries(genders: Record<string, number>) {
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

function localeFlag(locale: string): string {
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

function localeLabel(locale: string): string {
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

function GenderAgeHero({ audience }: { audience: { gender_age: Record<string, number> } }) {
  const { ages, genders } = splitGenderAge(audience.gender_age);
  const ageList = ageEntries(ages);
  const genderTotal = Object.values(genders).reduce((s, v) => s + v, 0);
  const fPct = genderTotal > 0 ? ((genders.F ?? 0) / genderTotal) * 100 : 0;
  const mPct = genderTotal > 0 ? ((genders.M ?? 0) / genderTotal) * 100 : 0;
  const uPct = Math.max(0, 100 - fPct - mPct);

  const dominantAge = ageList.reduce(
    (max, e) => (e.pct > (max?.pct ?? 0) ? e : max),
    null as null | (typeof ageList)[number],
  );

  if (genderTotal === 0 && ageList.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Dados de gênero e idade ainda não disponíveis.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-card to-muted/20 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-5">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Perfil dominante
          </p>
          <p className="text-2xl sm:text-3xl font-bold font-numeric tracking-tight mt-1">
            {dominantAge ? `${dominantAge.key} anos` : '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {fPct >= 55 && 'Maioria mulheres'}
            {mPct >= 55 && 'Maioria homens'}
            {fPct < 55 && mPct < 55 && 'Equilibrado'}
            {dominantAge && ` • ${dominantAge.pct.toFixed(0)}% da audiência`}
          </p>
        </div>
      </div>

      {genderTotal > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-muted-foreground">Gênero</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden flex bg-muted">
            {fPct > 0 && (
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${fPct}%`, backgroundColor: GENDER_COLORS.F }}
                title={`Mulheres ${fPct.toFixed(1)}%`}
              />
            )}
            {mPct > 0 && (
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${mPct}%`, backgroundColor: GENDER_COLORS.M }}
                title={`Homens ${mPct.toFixed(1)}%`}
              />
            )}
            {uPct > 0.1 && (
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${uPct}%`, backgroundColor: GENDER_COLORS.U }}
                title={`Outros ${uPct.toFixed(1)}%`}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: GENDER_COLORS.F }} />
              <span className="font-medium font-numeric">{fPct.toFixed(1)}%</span>
              <span className="text-muted-foreground">mulheres</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: GENDER_COLORS.M }} />
              <span className="font-medium font-numeric">{mPct.toFixed(1)}%</span>
              <span className="text-muted-foreground">homens</span>
            </div>
            {uPct > 0.1 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: GENDER_COLORS.U }} />
                <span className="font-medium font-numeric">{uPct.toFixed(1)}%</span>
                <span className="text-muted-foreground">outros</span>
              </div>
            )}
          </div>
        </div>
      )}

      {ageList.length > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="font-medium text-muted-foreground">Faixa etária</span>
          </div>
          <ul className="space-y-2.5">
            {ageList.map((e) => {
              const isDominant = dominantAge?.key === e.key;
              return (
                <li key={e.key} className="grid grid-cols-[60px_1fr_50px] items-center gap-3">
                  <span
                    className={cn(
                      'text-xs font-medium font-numeric',
                      isDominant ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {e.key}
                  </span>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        isDominant
                          ? 'bg-gradient-to-r from-primary/80 to-primary'
                          : 'bg-primary/40',
                      )}
                      style={{ width: `${e.pct}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      'text-xs font-numeric text-right',
                      isDominant ? 'font-semibold text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {e.pct.toFixed(1)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function CityRanking({ cities }: { cities: Record<string, number> }) {
  const list = topEntries(cities, 8);
  if (list.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem dados</p>;
  }
  const max = list[0].pct;
  return (
    <ul className="space-y-2.5">
      {list.map((e, i) => {
        const isTop3 = i < 3;
        const widthPct = max > 0 ? (e.pct / max) * 100 : 0;
        return (
          <li
            key={e.key}
            className={cn(
              'rounded-lg p-3 transition-all',
              isTop3 ? 'bg-muted/50' : 'hover:bg-muted/30',
            )}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={cn(
                    'shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-numeric',
                    i === 0 && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                    i === 1 && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                    i === 2 && 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                    i > 2 && 'bg-muted text-muted-foreground',
                  )}
                >
                  {i + 1}
                </span>
                <span className="text-sm font-medium truncate">{e.key}</span>
              </div>
              <span className="text-sm font-numeric font-semibold shrink-0">
                {e.pct.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  isTop3 ? 'bg-primary' : 'bg-primary/40',
                )}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function LocaleList({ locales }: { locales: Record<string, number> }) {
  const list = topEntries(locales, 5);
  if (list.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem dados</p>;
  }
  return (
    <ul className="space-y-2">
      {list.map((e) => (
        <li
          key={e.key}
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card hover:bg-muted/30 px-3 py-3 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl shrink-0" aria-hidden>
              {localeFlag(e.key)}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{localeLabel(e.key)}</p>
              <p className="text-xs text-muted-foreground font-numeric">{e.key}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-base font-bold font-numeric">{e.pct.toFixed(1)}%</p>
          </div>
        </li>
      ))}
    </ul>
  );
}


export default function MarketingDashboard() {
  const navigate = useNavigate();
  const { publishedPosts, pillars, loading } = useMarketingPostMetrics();
  const { instagramConnected, instagram: instagramIntegration, loading: integrationsLoading, fetchIntegrations } = useMarketingIntegrations();
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('30');
  const [customRange, setCustomRange] = useState<PeriodDateRange | null>(null);
  const [customPickerOpen, setCustomPickerOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<DailySnapshot[]>([]);

  const resolvedRange = useMemo(
    () => resolvePeriod(periodPreset, customRange),
    [periodPreset, customRange]
  );

  // Range pro hook de snapshots: 'all' = sem limite
  const snapshotsRange = useMemo(() => {
    if (periodPreset === 'all') {
      return { start: null, end: null };
    }
    return { start: resolvedRange.start, end: resolvedRange.end };
  }, [periodPreset, resolvedRange]);

  const {
    snapshots: accountSnapshots,
    audience,
    latest: latestAccount,
    oldest: oldestAccount,
    loading: accountLoading,
    syncNow,
    syncAudience,
  } = useMarketingAccountSnapshots(snapshotsRange);
  const [syncing, setSyncing] = useState(false);
  const [syncingAudience, setSyncingAudience] = useState(false);

  // Range "anterior" (mesmo tamanho, imediatamente antes) para comparações
  const prevRange = useMemo(() => resolvePrevRange(resolvedRange), [resolvedRange]);

  const range = resolvedRange;

  const currentPosts = useMemo<PostWithMetrics[]>(
    () =>
      publishedPosts.filter((p) =>
        inRange(p.scheduled_at ? new Date(p.scheduled_at) : null, range)
      ),
    [publishedPosts, range]
  );
  const prevPosts = useMemo<PostWithMetrics[]>(
    () =>
      publishedPosts.filter((p) =>
        inRange(p.scheduled_at ? new Date(p.scheduled_at) : null, {
          start: prevRange.prevStart,
          end: prevRange.prevEnd,
        })
      ),
    [publishedPosts, prevRange]
  );


  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('marketing_post_snapshots')
        .select('captured_at, views')
        .gte('captured_at', range.start.toISOString())
        .lte('captured_at', range.end.toISOString())
        .order('captured_at', { ascending: true });
      if (error) {
        setSnapshots([]);
        return;
      }
      if (cancelled) return;
      const map = new Map<string, number>();
      (data ?? []).forEach((row: { captured_at: string; views: number }) => {
        const day = new Date(row.captured_at).toISOString().slice(0, 10);
        map.set(day, (map.get(day) ?? 0) + (row.views ?? 0));
      });
      const arr: DailySnapshot[] = [...map.entries()]
        .map(([date, views]) => ({ date, views }))
        .sort((a, b) => a.date.localeCompare(b.date));
      setSnapshots(arr);
    })();
    return () => {
      cancelled = true;
    };
  }, [range.start, range.end]);

  const kpis = useMemo(() => {
    const sum = (arr: PostWithMetrics[], k: keyof PostWithMetrics) =>
      arr.reduce((s, p) => s + ((p[k] as number) ?? 0), 0);
    const avgEng = (arr: PostWithMetrics[]) =>
      arr.length === 0 ? 0 : arr.reduce((s, p) => s + (p.engagement_rate ?? 0), 0) / arr.length;

    return {
      countCurr: currentPosts.length,
      countPrev: prevPosts.length,
      viewsCurr: sum(currentPosts, 'views'),
      viewsPrev: sum(prevPosts, 'views'),
      engCurr: avgEng(currentPosts),
      engPrev: avgEng(prevPosts),
      followersCurr: sum(currentPosts, 'new_followers'),
      followersPrev: sum(prevPosts, 'new_followers'),
    };
  }, [currentPosts, prevPosts]);

  // ===== Account KPIs derived from accountSnapshots =====
  const accountKpis = useMemo(() => {
    if (!accountSnapshots || accountSnapshots.length === 0) return null;
    const last7 = accountSnapshots.slice(-7);
    const prev7 = accountSnapshots.slice(-14, -7);

    const sumKey = (arr: typeof accountSnapshots, key: 'reach_day' | 'views_day' | 'profile_views_day') =>
      arr.reduce((s, snap) => s + (snap[key] ?? 0), 0);

    const followersDelta7 = last7.reduce((s, snap) => s + (snap.followers_delta ?? 0), 0);

    const reach7 = sumKey(last7, 'reach_day');
    const reachPrev7 = sumKey(prev7, 'reach_day');
    const profileViews7 = sumKey(last7, 'profile_views_day');
    const profileViewsPrev7 = sumKey(prev7, 'profile_views_day');

    // posts delta: latest media_count - media_count from 7 days ago
    const earliestIn7 = last7[0];
    const newPosts7 = latestAccount && earliestIn7 && latestAccount.media_count != null && earliestIn7.media_count != null
      ? Math.max(0, latestAccount.media_count - earliestIn7.media_count)
      : 0;

    return {
      followersDelta7,
      reach7,
      reachChange: pctChange(reach7, reachPrev7),
      profileViews7,
      profileViewsChange: pctChange(profileViews7, profileViewsPrev7),
      newPosts7,
    };
  }, [accountSnapshots, latestAccount]);

  // ===== Daily series for charts =====
  const followersSeries = useMemo(
    () =>
      accountSnapshots
        .filter((s) => s.followers_count != null)
        .map((s) => ({
          date: s.captured_at.slice(0, 10),
          followers: s.followers_count as number,
        })),
    [accountSnapshots]
  );

  const reachSeries = useMemo(
    () =>
      accountSnapshots.slice(-14).map((s) => ({
        date: s.captured_at.slice(0, 10),
        reach: s.reach_day,
      })),
    [accountSnapshots]
  );

  const profileViewsSeries = useMemo(
    () =>
      accountSnapshots.slice(-14).map((s) => ({
        date: s.captured_at.slice(0, 10),
        views: s.profile_views_day,
      })),
    [accountSnapshots]
  );

  const topPosts = useMemo(
    () => [...currentPosts].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 5),
    [currentPosts]
  );

  const platformData = useMemo(() => {
    const map = new Map<string, number>();
    currentPosts.forEach((p) => {
      const key = p.platform ?? 'other';
      map.set(key, (map.get(key) ?? 0) + (p.views ?? 0));
    });
    return [...map.entries()]
      .map(([key, value]) => ({
        name: getPostPlatformLabel(key),
        key,
        value,
        color: PLATFORM_COLORS[key] ?? PLATFORM_COLORS.other,
      }))
      .filter((d) => d.value > 0);
  }, [currentPosts]);

  const pillarPerformance = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string; posts: number; views: number; eng: number }>();
    currentPosts.forEach((p) => {
      if (!p.pillar) return;
      const cur = map.get(p.pillar.id) ?? {
        id: p.pillar.id,
        name: p.pillar.name,
        color: p.pillar.color,
        posts: 0,
        views: 0,
        eng: 0,
      };
      cur.posts += 1;
      cur.views += p.views ?? 0;
      cur.eng += p.engagement_rate ?? 0;
      map.set(p.pillar.id, cur);
    });
    return [...map.values()]
      .map((r) => ({
        ...r,
        avgViews: r.posts ? Math.round(r.views / r.posts) : 0,
        avgEng: r.posts ? r.eng / r.posts : 0,
      }))
      .sort((a, b) => b.views - a.views);
  }, [currentPosts]);

  const formatPerformance = useMemo(() => {
    const map = new Map<string, { key: string; posts: number; views: number; eng: number }>();
    currentPosts.forEach((p) => {
      const key = p.format ?? 'outro';
      const cur = map.get(key) ?? { key, posts: 0, views: 0, eng: 0 };
      cur.posts += 1;
      cur.views += p.views ?? 0;
      cur.eng += p.engagement_rate ?? 0;
      map.set(key, cur);
    });
    return [...map.values()]
      .map((r) => ({
        ...r,
        label: getPostFormatLabel(r.key),
        avgViews: r.posts ? Math.round(r.views / r.posts) : 0,
        avgEng: r.posts ? r.eng / r.posts : 0,
      }))
      .sort((a, b) => b.views - a.views);
  }, [currentPosts]);

  const alerts = useMemo(() => {
    const list: { icon: React.ReactNode; text: string; tone: 'warn' | 'info' | 'success' }[] = [];

    const lastPub = publishedPosts
      .map((p) => (p.scheduled_at ? new Date(p.scheduled_at).getTime() : 0))
      .filter((t) => t > 0)
      .sort((a, b) => b - a)[0];
    if (lastPub) {
      const days = Math.floor((Date.now() - lastPub) / (24 * 60 * 60 * 1000));
      if (days > 7) {
        list.push({
          icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
          text: `Faz ${days} dias sem publicar`,
          tone: 'warn',
        });
      }
    }

    const engChange = pctChange(kpis.engCurr, kpis.engPrev);
    if (engChange !== null && engChange < -10) {
      list.push({
        icon: <ArrowDown className="h-4 w-4 text-red-500" />,
        text: `Engajamento caiu ${Math.abs(engChange).toFixed(1)}% vs período anterior`,
        tone: 'warn',
      });
    }

    const totalPosts = currentPosts.length;
    if (totalPosts > 0) {
      pillars.forEach((p) => {
        if (p.target_percentage == null) return;
        const real = (currentPosts.filter((cp) => cp.pillar_id === p.id).length / totalPosts) * 100;
        if (real < p.target_percentage - 5) {
          list.push({
            icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
            text: `Pilar "${p.name}" está abaixo da meta (${real.toFixed(0)}% vs meta ${p.target_percentage}%)`,
            tone: 'warn',
          });
        }
      });
    }

    const best = topPosts[0];
    if (best) {
      list.push({
        icon: <Sparkles className="h-4 w-4 text-emerald-500" />,
        text: `Melhor post do período: ${best.title}`,
        tone: 'success',
      });
    }

    return list;
  }, [publishedPosts, currentPosts, pillars, topPosts, kpis.engCurr, kpis.engPrev]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await syncNow();
      await fetchIntegrations();
      toast.success('Conta Instagram sincronizada com sucesso');
    } catch (e) {
      toast.error('Falha ao sincronizar', {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncAudience = async () => {
    try {
      setSyncingAudience(true);
      await syncAudience();
      await fetchIntegrations();
      toast.success('Audiência sincronizada');
    } catch (e) {
      toast.error('Falha ao sincronizar audiência', {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSyncingAudience(false);
    }
  };

  // Empty state — Instagram not connected
  if (!integrationsLoading && !instagramConnected) {
    return (
      <ResponsiveContainer maxWidth="7xl">
        <PageHeader
          title="Dashboard de Marketing"
          subtitle="Visão consolidada da conta Instagram e dos seus conteúdos"
        />
        <EmptyState
          icon={Plug}
          title="Conecte o Instagram para ver dados em tempo real"
          description="Configure a integração em Admin → Integrações de Marketing para ver seguidores, alcance, demografia e métricas dos seus posts atualizadas automaticamente todos os dias."
          action={{
            label: 'Ir para Integrações',
            onClick: () => navigate('/administracao/integracoes'),
          }}
        />
      </ResponsiveContainer>
    );
  }

  const syncStatus = formatTimeAgo(instagramIntegration?.last_sync_at);

  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader
        title="Dashboard de Marketing"
        subtitle="Visão consolidada da conta Instagram e dos seus conteúdos"
        actions={
          <Button onClick={handleSync} disabled={syncing} size="sm" className="gap-2">
            <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
            {syncing ? 'Sincronizando...' : 'Sincronizar agora'}
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Banner com identidade do Instagram */}
        <Card className="shadow-card hover:shadow-elegant transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Avatar com badge do Instagram */}
              <div className="relative shrink-0">
                <Avatar className="h-14 w-14 ring-2 ring-border">
                  {instagramIntegration?.profile_picture_url ? (
                    <AvatarImage
                      src={instagramIntegration.profile_picture_url}
                      alt={instagramIntegration.account_name ?? 'Instagram'}
                    />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-yellow-500/20 animate-pulse">
                    <Instagram className="h-6 w-6 text-foreground/70" />
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center ring-2 ring-card">
                  <Instagram className="h-3 w-3 text-white" />
                </span>
              </div>

              {/* Informações */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground truncate">
                    {instagramIntegration?.account_name ?? '@hirofilm'}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
                      syncStatus.tone === 'ok' && 'bg-success/10 text-success',
                      syncStatus.tone === 'warn' && 'bg-warning/10 text-warning',
                      syncStatus.tone === 'idle' && 'bg-muted text-muted-foreground'
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        syncStatus.tone === 'ok' && 'bg-success',
                        syncStatus.tone === 'warn' && 'bg-warning',
                        syncStatus.tone === 'idle' && 'bg-muted-foreground'
                      )}
                    />
                    Conectado
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {instagramIntegration?.last_sync_at
                    ? `Última sincronização ${formatRelativeTime(new Date(instagramIntegration.last_sync_at))}`
                    : syncStatus.text}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs principais da CONTA */}
        {accountSnapshots.length === 0 && !accountLoading ? (
          <Card>
            <CardContent className="py-10">
              <EmptyState
                icon={RefreshCw}
                title="Aguardando primeira sincronização"
                description="Clique em 'Sincronizar agora' para puxar os dados atuais da conta Instagram."
                action={{ label: 'Sincronizar agora', onClick: handleSync }}
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <AccountKpiCard
                icon={Users}
                label="Seguidores"
                value={(latestAccount?.followers_count ?? 0).toLocaleString('pt-BR')}
                subtitle={
                  accountKpis
                    ? `${accountKpis.followersDelta7 >= 0 ? '+' : ''}${accountKpis.followersDelta7} esta semana`
                    : undefined
                }
                subtone={
                  accountKpis
                    ? accountKpis.followersDelta7 >= 0
                      ? 'positive'
                      : 'negative'
                    : 'muted'
                }
              />
              <AccountKpiCard
                icon={BarChart3}
                label="Alcance (7 dias)"
                value={(accountKpis?.reach7 ?? 0).toLocaleString('pt-BR')}
                subtitle={
                  accountKpis?.reachChange !== null && accountKpis?.reachChange !== undefined
                    ? `${accountKpis.reachChange >= 0 ? '+' : ''}${accountKpis.reachChange.toFixed(1)}% vs 7d ant.`
                    : 'sem comparação'
                }
                subtone={
                  accountKpis?.reachChange !== null && accountKpis?.reachChange !== undefined
                    ? accountKpis.reachChange >= 0
                      ? 'positive'
                      : 'negative'
                    : 'muted'
                }
              />
              <AccountKpiCard
                icon={Eye}
                label="Visitas no perfil (7d)"
                value={(accountKpis?.profileViews7 ?? 0).toLocaleString('pt-BR')}
                subtitle={
                  accountKpis?.profileViewsChange !== null &&
                  accountKpis?.profileViewsChange !== undefined
                    ? `${accountKpis.profileViewsChange >= 0 ? '+' : ''}${accountKpis.profileViewsChange.toFixed(1)}% vs 7d ant.`
                    : 'sem comparação'
                }
                subtone={
                  accountKpis?.profileViewsChange !== null &&
                  accountKpis?.profileViewsChange !== undefined
                    ? accountKpis.profileViewsChange >= 0
                      ? 'positive'
                      : 'negative'
                    : 'muted'
                }
              />
              <AccountKpiCard
                icon={FileText}
                label="Posts publicados"
                value={(latestAccount?.media_count ?? 0).toLocaleString('pt-BR')}
                subtitle={
                  accountKpis && accountKpis.newPosts7 > 0
                    ? `+${accountKpis.newPosts7} esta semana`
                    : 'lifetime'
                }
                subtone="muted"
              />
            </div>

            {/* Followers evolution chart */}
            <Card className="shadow-card hover:shadow-elegant transition-all duration-200">
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Evolução de seguidores
                </CardTitle>
                <span className="text-xs text-muted-foreground font-numeric">
                  {periodPreset === 'all' && oldestAccount?.captured_at
                    ? `Desde ${formatDate(new Date(oldestAccount.captured_at), "dd 'de' MMM yyyy", { locale: ptBRLocale })}`
                    : PERIOD_OPTIONS.find(o => o.value === periodPreset)?.label ?? ''}
                </span>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {followersSeries.length < 2 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-6 gap-2">
                      <Users className="h-8 w-8 text-muted-foreground/60" />
                      <p className="text-sm font-medium text-foreground">
                        Coletando histórico de seguidores
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        A API do Instagram não fornece histórico de seguidores. O gráfico
                        ganha forma à medida que cada dia é capturado pelo sistema.
                      </p>
                      <p className="text-xs text-muted-foreground font-numeric mt-1">
                        {followersSeries.length}/7 dias coletados
                      </p>
                    </div>
                  ) : (
                    <RechartsContainer width="100%" height="100%">
                      <AreaChart data={followersSeries} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <defs>
                          <linearGradient id="followersGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          tickFormatter={fmtChartDate}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={(v: number) => v.toLocaleString('pt-BR')}
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontFamily: 'Inter, system-ui, sans-serif', style: { fontVariantNumeric: 'tabular-nums' } } as any}
                          axisLine={false}
                          tickLine={false}
                          domain={['dataMin - 10', 'dataMax + 10']}
                        />
                        <RTooltip content={<ChartTooltip unit="seguidores" />} />
                        <Area
                          type="monotone"
                          dataKey="followers"
                          stroke="hsl(var(--primary))"
                          strokeWidth={3}
                          fill="url(#followersGradient)"
                          dot={{ fill: 'hsl(var(--primary))', r: 3, strokeWidth: 0 }}
                          activeDot={{ fill: 'hsl(var(--primary))', r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                        />
                      </AreaChart>
                    </RechartsContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Daily reach + profile views */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="shadow-card hover:shadow-elegant transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Alcance diário (14 dias)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-56">
                    {reachSeries.length === 0 ? (
                      <EmptyState compact icon={BarChart3} title="" description="Sem dados no período." />
                    ) : (
                      <RechartsContainer width="100%" height="100%">
                        <AreaChart data={reachSeries} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                          <defs>
                            <linearGradient id="reachGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            tickFormatter={fmtChartDate}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tickFormatter={(v: number) => v.toLocaleString('pt-BR')}
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontFamily: 'Inter, system-ui, sans-serif', style: { fontVariantNumeric: 'tabular-nums' } } as any}
                            axisLine={false}
                            tickLine={false}
                          />
                          <RTooltip content={<ChartTooltip unit="alcance" />} />
                          <Area
                            type="monotone"
                            dataKey="reach"
                            stroke="hsl(var(--warning))"
                            strokeWidth={2.5}
                            fill="url(#reachGradient)"
                            dot={false}
                            activeDot={{ fill: 'hsl(var(--warning))', r: 4, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                          />
                        </AreaChart>
                      </RechartsContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elegant transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Visitas no perfil (14 dias)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-56">
                    {profileViewsSeries.length === 0 ? (
                      <EmptyState compact icon={Eye} title="" description="Sem dados no período." />
                    ) : (
                      <RechartsContainer width="100%" height="100%">
                        <AreaChart data={profileViewsSeries} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                          <defs>
                            <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            tickFormatter={fmtChartDate}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tickFormatter={(v: number) => v.toLocaleString('pt-BR')}
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontFamily: 'Inter, system-ui, sans-serif', style: { fontVariantNumeric: 'tabular-nums' } } as any}
                            axisLine={false}
                            tickLine={false}
                          />
                          <RTooltip content={<ChartTooltip unit="visitas" />} />
                          <Area
                            type="monotone"
                            dataKey="views"
                            stroke="hsl(var(--success))"
                            strokeWidth={2.5}
                            fill="url(#visitsGradient)"
                            dot={false}
                            activeDot={{ fill: 'hsl(var(--success))', r: 4, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                          />
                        </AreaChart>
                      </RechartsContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sobre sua audiência */}
            <Card className="shadow-card overflow-hidden">
              <CardHeader className="pb-4 flex-row items-start justify-between space-y-0 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base sm:text-lg">Sobre sua audiência</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Quem te segue no Instagram
                    </p>
                  </div>
                </div>
                {audience && (
                  <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    Atualizado {formatTimeAgo(audience.captured_at).text}
                  </span>
                )}
              </CardHeader>
              <CardContent>
                {!audience ? (
                  <EmptyState
                    icon={Users}
                    title="Sem dados de audiência ainda"
                    description="A demografia é atualizada semanalmente. Você pode forçar a primeira sincronização agora."
                    action={{
                      label: syncingAudience ? 'Sincronizando...' : 'Sincronizar audiência agora',
                      onClick: handleSyncAudience,
                    }}
                  />
                ) : (
                  <div className="space-y-6">
                    <GenderAgeHero audience={audience} />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <div className="lg:col-span-7">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <h4 className="text-sm font-semibold">Top cidades</h4>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {topEntries(audience.cities, 100).length} cidades
                          </span>
                        </div>
                        <CityRanking cities={audience.cities} />
                      </div>

                      <div className="lg:col-span-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <h4 className="text-sm font-semibold">Idiomas falados</h4>
                          </div>
                        </div>
                        <LocaleList locales={audience.locales} />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* ===== Conteúdos publicados (existente) ===== */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Performance dos conteúdos
          </h2>
          <span className="text-xs text-muted-foreground font-numeric">
            {periodPreset === 'custom' && customRange
              ? `${formatDate(customRange.start, 'dd/MM/yy', { locale: ptBRLocale })} → ${formatDate(customRange.end, 'dd/MM/yy', { locale: ptBRLocale })}`
              : PERIOD_OPTIONS.find(o => o.value === periodPreset)?.label ?? ''}
          </span>
        </div>

        {!loading && publishedPosts.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <EmptyState
                icon={BarChart3}
                title="Publique seu primeiro post para ver métricas aqui"
                description='Quando você marcar posts como "Publicado" e adicionar métricas, esta seção vai consolidar a performance.'
                action={{ label: 'Ir ao Calendário', onClick: () => navigate('/marketing') }}
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiCard
                emoji="📊"
                label="Posts publicados"
                value={kpis.countCurr}
                change={pctChange(kpis.countCurr, kpis.countPrev)}
              />
              <KpiCard
                emoji="👁️"
                label="Views totais"
                value={kpis.viewsCurr.toLocaleString('pt-BR')}
                change={pctChange(kpis.viewsCurr, kpis.viewsPrev)}
              />
              <KpiCard
                emoji="❤️"
                label="Engajamento médio"
                value={`${kpis.engCurr.toFixed(2)}%`}
                change={pctChange(kpis.engCurr, kpis.engPrev)}
              />
              <KpiCard
                emoji="🚀"
                label="Novos seguidores"
                value={kpis.followersCurr.toLocaleString('pt-BR')}
                change={pctChange(kpis.followersCurr, kpis.followersPrev)}
              />
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Evolução de views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {snapshots.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <EmptyState
                        compact
                        icon={CalendarIcon}
                        title=""
                        description="Sem snapshots no período. As métricas começam a gerar histórico ao serem atualizadas."
                      />
                    </div>
                  ) : (
                    <RechartsContainer width="100%" height="100%">
                      <AreaChart data={snapshots} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <defs>
                          <linearGradient id="postsViewsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          tickFormatter={fmtChartDate}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={(v: number) => v.toLocaleString('pt-BR')}
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontFamily: 'Inter, system-ui, sans-serif', style: { fontVariantNumeric: 'tabular-nums' } } as any}
                          axisLine={false}
                          tickLine={false}
                        />
                        <RTooltip content={<ChartTooltip unit="views" />} />
                        <Area
                          type="monotone"
                          dataKey="views"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2.5}
                          fill="url(#postsViewsGradient)"
                          dot={false}
                          activeDot={{ fill: 'hsl(var(--primary))', r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                        />
                      </AreaChart>
                    </RechartsContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Top 5 posts</CardTitle>
                </CardHeader>
                <CardContent>
                  {topPosts.length === 0 ? (
                    <EmptyState compact icon={Trophy} title="" description="Nenhum post publicado no período." />
                  ) : (
                    <ul className="divide-y divide-border">
                      {topPosts.map((p, i) => (
                        <li key={p.id} className="flex items-center gap-3 py-2.5">
                          <span className="w-5 text-xs text-muted-foreground font-numeric">{i + 1}</span>
                          {p.cover_url ? (
                            <img
                              src={p.cover_url}
                              alt={p.title}
                              className="h-10 w-10 rounded-md object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{p.title}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {p.platform && (
                                <Badge variant="secondary" className="text-[10px]">
                                  {getPostPlatformLabel(p.platform)}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-sm font-semibold font-numeric">
                            {(p.views ?? 0).toLocaleString('pt-BR')} views
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Distribuição por plataforma</CardTitle>
                </CardHeader>
                <CardContent>
                  {platformData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center">
                      <EmptyState compact icon={PieIcon} title="" description="Sem dados." />
                    </div>
                  ) : (
                    <div className="h-48">
                      <RechartsContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={platformData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={2}
                          >
                            {platformData.map((d) => (
                              <Cell key={d.key} fill={d.color} />
                            ))}
                          </Pie>
                          <RTooltip
                            contentStyle={{ borderRadius: 8, fontSize: 12 }}
                            formatter={(v: number) => v.toLocaleString('pt-BR')}
                          />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </RechartsContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Performance por pilar</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {pillarPerformance.length === 0 ? (
                    <div className="px-4 py-2">
                      <EmptyState compact icon={Layers} title="" description="Sem dados de pilares." />
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-muted-foreground">
                          <th className="px-4 py-2 font-medium">Pilar</th>
                          <th className="px-2 py-2 font-medium text-right">Posts</th>
                          <th className="px-2 py-2 font-medium text-right">Views méd.</th>
                          <th className="px-4 py-2 font-medium text-right">Eng. %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pillarPerformance.map((r) => (
                          <tr key={r.id} className="border-t border-border">
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: getPillarColor(r.color).hex }}
                                />
                                <span className="truncate">{r.name}</span>
                              </div>
                            </td>
                            <td className="px-2 py-2 text-right font-numeric">{r.posts}</td>
                            <td className="px-2 py-2 text-right font-numeric">
                              {r.avgViews.toLocaleString('pt-BR')}
                            </td>
                            <td className="px-4 py-2 text-right font-numeric">{r.avgEng.toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Performance por formato</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {formatPerformance.length === 0 ? (
                    <div className="px-4 py-2">
                      <EmptyState compact icon={ImageIcon} title="" description="Sem dados de formatos." />
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-muted-foreground">
                          <th className="px-4 py-2 font-medium">Formato</th>
                          <th className="px-2 py-2 font-medium text-right">Posts</th>
                          <th className="px-2 py-2 font-medium text-right">Views méd.</th>
                          <th className="px-4 py-2 font-medium text-right">Eng. %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formatPerformance.map((r) => (
                          <tr key={r.key} className="border-t border-border">
                            <td className="px-4 py-2 truncate">{r.label}</td>
                            <td className="px-2 py-2 text-right font-numeric">{r.posts}</td>
                            <td className="px-2 py-2 text-right font-numeric">
                              {r.avgViews.toLocaleString('pt-BR')}
                            </td>
                            <td className="px-4 py-2 text-right font-numeric">{r.avgEng.toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Alertas</CardTitle>
                </CardHeader>
                <CardContent>
                  {alerts.length === 0 ? (
                    <EmptyState compact icon={CheckCircle} title="" description="Tudo certo por aqui ✨" />
                  ) : (
                    <ul className="space-y-2">
                      {alerts.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="mt-0.5">{a.icon}</span>
                          <span className="flex-1">{a.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </ResponsiveContainer>
  );
}
