import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMarketingPostMetrics, type PostWithMetrics } from '@/hooks/useMarketingPostMetrics';
import { useMarketingAccountSnapshots } from '@/hooks/useMarketingAccountSnapshots';
import { useMarketingIntegrations } from '@/hooks/useMarketingIntegrations';
import { getPillarColor } from '@/lib/marketing-colors';
import { getPostPlatformLabel, getPostFormatLabel } from '@/lib/marketing-posts-config';
import { supabase } from '@/integrations/supabase/client';

type Period = '7' | '30' | '90' | 'this_month' | 'last_month';
type AccountPeriod = 7 | 30 | 90;

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: 'this_month', label: 'Este mês' },
  { value: 'last_month', label: 'Mês passado' },
];

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

function getRange(period: Period): DateRange {
  const now = new Date();
  if (period === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = now;
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { start, end, prevStart, prevEnd };
  }
  if (period === 'last_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);
    return { start, end, prevStart, prevEnd };
  }
  const days = parseInt(period, 10);
  const end = now;
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - days * 24 * 60 * 60 * 1000);
  return { start, end, prevStart, prevEnd };
}

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

function ChangeBadge({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" /> sem dados
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
      {Math.abs(value).toFixed(1)}%
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
        <div className="text-3xl font-semibold mt-2 tabular-nums">{value}</div>
        <div className="mt-1">
          <ChangeBadge value={change} />
          <span className="text-[10px] text-muted-foreground ml-1">vs período anterior</span>
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
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" />
          <span>{label}</span>
        </div>
        <div className="text-3xl font-semibold mt-2 tabular-nums">{value}</div>
        {subtitle && (
          <div
            className={cn(
              'mt-1 text-xs font-medium',
              subtone === 'positive' && 'text-emerald-500',
              subtone === 'negative' && 'text-red-500',
              subtone === 'muted' && 'text-muted-foreground'
            )}
          >
            {subtitle}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DailySnapshot {
  date: string; // yyyy-mm-dd
  views: number;
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

export default function MarketingDashboard() {
  const navigate = useNavigate();
  const { publishedPosts, pillars, loading } = useMarketingPostMetrics();
  const { instagramConnected, loading: integrationsLoading } = useMarketingIntegrations();
  const [period, setPeriod] = useState<Period>('30');
  const [snapshots, setSnapshots] = useState<DailySnapshot[]>([]);

  // Account-level snapshots
  const [accountPeriod, setAccountPeriod] = useState<AccountPeriod>(30);
  const {
    snapshots: accountSnapshots,
    audience,
    latest: latestAccount,
    loading: accountLoading,
    syncNow,
    syncAudience,
  } = useMarketingAccountSnapshots(accountPeriod);
  const [syncing, setSyncing] = useState(false);
  const [syncingAudience, setSyncingAudience] = useState(false);

  const range = useMemo(() => getRange(period), [period]);

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
          start: range.prevStart,
          end: range.prevEnd,
        })
      ),
    [publishedPosts, range]
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
    const newPosts7 = latestAccount && earliestIn7
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
      accountSnapshots.map((s) => ({
        date: s.captured_at.slice(0, 10),
        followers: s.followers_count,
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
            onClick: () => navigate('/admin/integracoes-marketing'),
          }}
        />
      </ResponsiveContainer>
    );
  }

  const syncStatus = formatTimeAgo(latestAccount?.captured_at);

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
        {/* Banner de status do sync */}
        <Card>
          <CardContent className="p-3 flex items-center gap-3 text-sm">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                syncStatus.tone === 'ok' && 'bg-emerald-500',
                syncStatus.tone === 'warn' && 'bg-amber-500',
                syncStatus.tone === 'idle' && 'bg-muted-foreground/50'
              )}
            />
            <div className="flex-1">
              {latestAccount ? (
                <span>
                  Conta Instagram sincronizada —{' '}
                  <span className="text-muted-foreground">última atualização {syncStatus.text}</span>
                </span>
              ) : (
                <span className="text-muted-foreground">{syncStatus.text}</span>
              )}
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
            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Evolução de seguidores</CardTitle>
                <Select
                  value={String(accountPeriod)}
                  onValueChange={(v) => setAccountPeriod(Number(v) as AccountPeriod)}
                >
                  <SelectTrigger className="h-8 w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="90">90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {followersSeries.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <EmptyState compact icon={CalendarIcon} title="" description="Sem snapshots no período." />
                    </div>
                  ) : (
                    <RechartsContainer width="100%" height="100%">
                      <LineChart data={followersSeries}>
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) =>
                            new Date(v + 'T12:00:00').toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                            })
                          }
                        />
                        <YAxis tick={{ fontSize: 11 }} domain={['dataMin - 5', 'dataMax + 5']} />
                        <RTooltip
                          contentStyle={{ borderRadius: 8, fontSize: 12 }}
                          labelFormatter={(v) => new Date(v + 'T12:00:00').toLocaleDateString('pt-BR')}
                          formatter={(v: number) => [v.toLocaleString('pt-BR'), 'Seguidores']}
                        />
                        <Line
                          type="monotone"
                          dataKey="followers"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </RechartsContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Daily reach + profile views */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Alcance diário (14 dias)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-56">
                    {reachSeries.length === 0 ? (
                      <EmptyState compact icon={BarChart3} title="" description="Sem dados no período." />
                    ) : (
                      <RechartsContainer width="100%" height="100%">
                        <BarChart data={reachSeries}>
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11 }}
                            tickFormatter={(v) =>
                              new Date(v + 'T12:00:00').toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                              })
                            }
                          />
                          <YAxis tick={{ fontSize: 11 }} />
                          <RTooltip
                            contentStyle={{ borderRadius: 8, fontSize: 12 }}
                            labelFormatter={(v) => new Date(v + 'T12:00:00').toLocaleDateString('pt-BR')}
                            formatter={(v: number) => [v.toLocaleString('pt-BR'), 'Alcance']}
                          />
                          <Bar dataKey="reach" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </RechartsContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Visitas no perfil (14 dias)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-56">
                    {profileViewsSeries.length === 0 ? (
                      <EmptyState compact icon={Eye} title="" description="Sem dados no período." />
                    ) : (
                      <RechartsContainer width="100%" height="100%">
                        <BarChart data={profileViewsSeries}>
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11 }}
                            tickFormatter={(v) =>
                              new Date(v + 'T12:00:00').toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                              })
                            }
                          />
                          <YAxis tick={{ fontSize: 11 }} />
                          <RTooltip
                            contentStyle={{ borderRadius: 8, fontSize: 12 }}
                            labelFormatter={(v) => new Date(v + 'T12:00:00').toLocaleDateString('pt-BR')}
                            formatter={(v: number) => [v.toLocaleString('pt-BR'), 'Visitas']}
                          />
                          <Bar dataKey="views" fill="hsl(var(--accent-foreground))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </RechartsContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sobre sua audiência */}
            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Sobre sua audiência</CardTitle>
                {audience && (
                  <span className="text-xs text-muted-foreground">
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Gênero e Idade */}
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-3">Gênero e Idade</div>
                      {topEntries(audience.gender_age, 8).length === 0 ? (
                        <p className="text-xs text-muted-foreground">Sem dados</p>
                      ) : (
                        <ul className="space-y-2">
                          {topEntries(audience.gender_age, 8).map((e) => (
                            <li key={e.key} className="text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{e.key}</span>
                                <span className="tabular-nums text-muted-foreground">{e.pct.toFixed(1)}%</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${e.pct}%`,
                                    backgroundColor: genderColor(e.key),
                                  }}
                                />
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Top cidades */}
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        Top cidades
                      </div>
                      {topEntries(audience.cities, 5).length === 0 ? (
                        <p className="text-xs text-muted-foreground">Sem dados</p>
                      ) : (
                        <ul className="space-y-2">
                          {topEntries(audience.cities, 5).map((e) => (
                            <li key={e.key} className="text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium truncate pr-2">{e.key}</span>
                                <span className="tabular-nums text-muted-foreground">{e.pct.toFixed(1)}%</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${e.pct}%` }}
                                />
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Idiomas */}
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5" />
                        Idiomas
                      </div>
                      {topEntries(audience.locales, 3).length === 0 ? (
                        <p className="text-xs text-muted-foreground">Sem dados</p>
                      ) : (
                        <div className="space-y-2">
                          {topEntries(audience.locales, 3).map((e) => (
                            <div
                              key={e.key}
                              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2"
                            >
                              <span className="text-sm font-medium">{e.key}</span>
                              <span className="text-xs tabular-nums text-muted-foreground">
                                {e.pct.toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
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
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                      <LineChart data={snapshots}>
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) =>
                            new Date(v + 'T12:00:00').toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                            })
                          }
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <RTooltip
                          contentStyle={{ borderRadius: 8, fontSize: 12 }}
                          labelFormatter={(v) => new Date(v + 'T12:00:00').toLocaleDateString('pt-BR')}
                        />
                        <Line
                          type="monotone"
                          dataKey="views"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
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
                          <span className="w-5 text-xs text-muted-foreground tabular-nums">{i + 1}</span>
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
                          <div className="text-sm font-semibold tabular-nums">
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
                            <td className="px-2 py-2 text-right tabular-nums">{r.posts}</td>
                            <td className="px-2 py-2 text-right tabular-nums">
                              {r.avgViews.toLocaleString('pt-BR')}
                            </td>
                            <td className="px-4 py-2 text-right tabular-nums">{r.avgEng.toFixed(2)}%</td>
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
                            <td className="px-2 py-2 text-right tabular-nums">{r.posts}</td>
                            <td className="px-2 py-2 text-right tabular-nums">
                              {r.avgViews.toLocaleString('pt-BR')}
                            </td>
                            <td className="px-4 py-2 text-right tabular-nums">{r.avgEng.toFixed(2)}%</td>
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
