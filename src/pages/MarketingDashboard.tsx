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
import { useMarketingGA4 } from '@/hooks/useMarketingGA4';
import { getPillarColor } from '@/lib/marketing-colors';
import { getPostPlatformLabel, getPostFormatLabel } from '@/lib/marketing-posts-config';
import { supabase } from '@/integrations/supabase/client';

import { PeriodPicker, type PeriodPreset, type PeriodDateRange, PERIOD_OPTIONS } from '@/components/Marketing/PeriodPicker';
import { format as formatDate } from 'date-fns';
import { ptBR as ptBRLocale } from 'date-fns/locale';

import {
  resolvePeriod,
  resolvePrevRange,
  inRange,
  pctChange,
  formatTimeAgo,
  fmtChartDate,
  genderColor,
  topEntries,
  splitGenderAge,
  ageEntries,
  genderEntries,
  localeFlag,
  localeLabel,
  PLATFORM_COLORS,
  GENDER_COLORS,
  type DailySnapshot,
  type DateRange,
} from '@/lib/marketing-dashboard-utils';

import { ChangeBadge } from '@/components/Marketing/dashboard/ChangeBadge';
import { KpiCard } from '@/components/Marketing/dashboard/KpiCard';
import { AccountKpiCard } from '@/components/Marketing/dashboard/AccountKpiCard';
import { ChartTooltip } from '@/components/Marketing/dashboard/ChartTooltip';

import { GenderAgeHero } from '@/components/Marketing/dashboard/GenderAgeHero';
import { CityRanking } from '@/components/Marketing/dashboard/CityRanking';
import { LocaleList } from '@/components/Marketing/dashboard/LocaleList';
import { InstagramIdentityBanner } from '@/components/Marketing/dashboard/InstagramIdentityBanner';

export default function MarketingDashboard() {
  const navigate = useNavigate();
  const { publishedPosts, pillars, loading } = useMarketingPostMetrics();
  const { instagramConnected, instagram: instagramIntegration, loading: integrationsLoading, fetchIntegrations, integrations } = useMarketingIntegrations();
  const ga4Integration = integrations.find((i) => i.platform === 'google_analytics');
  const ga4Connected = ga4Integration?.status === 'connected';
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

  const ga4 = useMarketingGA4(snapshotsRange);
  const { syncNow: syncGA4 } = ga4;

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

  // Label do período (preset + datas concretas) — mostrado nos cabeçalhos dos gráficos
  const periodLabel = useMemo(() => {
    if (periodPreset === 'all') {
      return oldestAccount?.captured_at
        ? `Desde ${formatDate(new Date(oldestAccount.captured_at), "dd 'de' MMM yyyy", { locale: ptBRLocale })}`
        : 'Todo o período';
    }
    if (periodPreset === 'custom' && customRange) {
      return `${formatDate(customRange.start, 'dd/MM/yy', { locale: ptBRLocale })} → ${formatDate(customRange.end, 'dd/MM/yy', { locale: ptBRLocale })}`;
    }
    const preset = PERIOD_OPTIONS.find(o => o.value === periodPreset)?.label ?? '';
    const range = `${formatDate(resolvedRange.start, 'dd/MM', { locale: ptBRLocale })} → ${formatDate(resolvedRange.end, 'dd/MM', { locale: ptBRLocale })}`;
    return `${preset} · ${range}`;
  }, [periodPreset, customRange, resolvedRange, oldestAccount]);

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

  // Snapshots do range anterior (mesmo tamanho, imediatamente antes) — para comparação
  const [prevAccountSnapshots, setPrevAccountSnapshots] = useState<typeof accountSnapshots>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Em "Todo o período" não existe "anterior"
      if (periodPreset === 'all') {
        if (!cancelled) setPrevAccountSnapshots([]);
        return;
      }
      const { data } = await supabase
        .from('marketing_account_snapshots')
        .select('*')
        .gte('captured_at', prevRange.prevStart.toISOString())
        .lte('captured_at', prevRange.prevEnd.toISOString())
        .order('captured_at', { ascending: true });
      if (!cancelled) setPrevAccountSnapshots((data ?? []) as typeof accountSnapshots);
    })();
    return () => { cancelled = true; };
  }, [periodPreset, prevRange.prevStart, prevRange.prevEnd]);

  // ===== Account KPIs derived from accountSnapshots (sobre o período inteiro selecionado) =====
  const accountKpis = useMemo(() => {
    if (!accountSnapshots || accountSnapshots.length === 0) return null;

    const sumKey = (arr: typeof accountSnapshots, key: 'reach_day' | 'views_day' | 'profile_views_day') =>
      arr.reduce((s, snap) => s + (snap[key] ?? 0), 0);

    const followersDeltaPeriod = accountSnapshots.reduce(
      (s, snap) => s + (snap.followers_delta ?? 0),
      0
    );

    const reachPeriod = sumKey(accountSnapshots, 'reach_day');
    const reachPrev = sumKey(prevAccountSnapshots, 'reach_day');
    const profileViewsPeriod = sumKey(accountSnapshots, 'profile_views_day');
    const profileViewsPrev = sumKey(prevAccountSnapshots, 'profile_views_day');

    // Novos posts no período: media_count do último - do primeiro snapshot do range
    const firstInPeriod = accountSnapshots[0];
    const newPostsPeriod =
      latestAccount && firstInPeriod &&
      latestAccount.media_count != null && firstInPeriod.media_count != null
        ? Math.max(0, latestAccount.media_count - firstInPeriod.media_count)
        : 0;

    return {
      followersDeltaPeriod,
      reachPeriod,
      reachChange: pctChange(reachPeriod, reachPrev),
      profileViewsPeriod,
      profileViewsChange: pctChange(profileViewsPeriod, profileViewsPrev),
      newPostsPeriod,
    };
  }, [accountSnapshots, prevAccountSnapshots, latestAccount]);

  // ===== Daily series for charts (já vem filtrado pelo período do hook) =====
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
      accountSnapshots.map((s) => ({
        date: s.captured_at.slice(0, 10),
        reach: s.reach_day,
      })),
    [accountSnapshots]
  );

  const profileViewsSeries = useMemo(
    () =>
      accountSnapshots.map((s) => ({
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
      const results = await Promise.allSettled([
        syncNow(),
        ga4Connected ? syncGA4() : Promise.resolve(null),
      ]);
      await fetchIntegrations();

      const igResult = results[0];
      const gaResult = results[1];
      const igOk = igResult.status === 'fulfilled';
      const gaOk = gaResult.status === 'fulfilled';

      if (igOk && (gaOk || !ga4Connected)) {
        toast.success(
          ga4Connected
            ? 'Instagram e Google Analytics sincronizados'
            : 'Conta Instagram sincronizada com sucesso'
        );
      } else if (!igOk && !gaOk) {
        toast.error('Falha ao sincronizar', {
          description: igResult.status === 'rejected'
            ? (igResult.reason instanceof Error ? igResult.reason.message : String(igResult.reason))
            : undefined,
        });
      } else {
        const failed = !igOk ? 'Instagram' : 'Google Analytics';
        const reason = !igOk ? igResult.reason : (gaResult as PromiseRejectedResult).reason;
        toast.warning(`${failed} falhou ao sincronizar`, {
          description: reason instanceof Error ? reason.message : String(reason),
        });
      }
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

  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader
        title="Dashboard de Marketing"
        subtitle="Visão consolidada da conta Instagram e dos seus conteúdos"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <PeriodPicker
              preset={periodPreset}
              customRange={customRange}
              oldestSnapshotDate={oldestAccount?.captured_at ? new Date(oldestAccount.captured_at) : null}
              onPresetChange={(p) => {
                if (p === 'custom') {
                  setCustomPickerOpen(true);
                } else {
                  setPeriodPreset(p);
                  setCustomRange(null);
                }
              }}
              onCustomRangeChange={(range) => {
                setCustomRange(range);
                setPeriodPreset('custom');
                setCustomPickerOpen(false);
              }}
              customPickerOpen={customPickerOpen}
              onCustomPickerOpenChange={setCustomPickerOpen}
            />
            <Button onClick={handleSync} disabled={syncing} size="sm" className="gap-2">
              <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
              {syncing ? 'Sincronizando...' : 'Sincronizar agora'}
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Banner com identidade do Instagram */}
        <InstagramIdentityBanner integration={instagramIntegration} />

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
                    ? `${accountKpis.followersDeltaPeriod >= 0 ? '+' : ''}${accountKpis.followersDeltaPeriod} no período`
                    : undefined
                }
                subtone={
                  accountKpis
                    ? accountKpis.followersDeltaPeriod >= 0
                      ? 'positive'
                      : 'negative'
                    : 'muted'
                }
              />
              <AccountKpiCard
                icon={BarChart3}
                label="Alcance no período"
                value={(accountKpis?.reachPeriod ?? 0).toLocaleString('pt-BR')}
                subtitle={
                  accountKpis?.reachChange !== null && accountKpis?.reachChange !== undefined
                    ? `${accountKpis.reachChange >= 0 ? '+' : ''}${accountKpis.reachChange.toFixed(1)}% vs período anterior`
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
                label="Visitas no perfil"
                value={(accountKpis?.profileViewsPeriod ?? 0).toLocaleString('pt-BR')}
                subtitle={
                  accountKpis?.profileViewsChange !== null &&
                  accountKpis?.profileViewsChange !== undefined
                    ? `${accountKpis.profileViewsChange >= 0 ? '+' : ''}${accountKpis.profileViewsChange.toFixed(1)}% vs período anterior`
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
                  accountKpis && accountKpis.newPostsPeriod > 0
                    ? `+${accountKpis.newPostsPeriod} no período`
                    : 'total acumulado'
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
                  {periodLabel}
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
                    Alcance diário
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
                    Visitas no perfil
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

        {/* ===== Tráfego do site (GA4) ===== */}
        {ga4Connected && (
          <>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                <BarChart3 className="h-5 w-5 text-orange-500" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold">Tráfego do site</h2>
                <p className="text-xs text-muted-foreground">hiro.film via Google Analytics</p>
              </div>
            </div>

            {ga4.snapshots.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <EmptyState
                    icon={BarChart3}
                    title="Aguardando primeiros dados do GA4"
                    description="A sincronização roda diariamente às 8h UTC. Você também pode sincronizar manualmente no topo da página."
                  />
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <AccountKpiCard
                    icon={Users}
                    label="Visitantes únicos"
                    value={Math.round(ga4.totals.users).toLocaleString('pt-BR')}
                    subtitle={`${Math.round(ga4.totals.sessions).toLocaleString('pt-BR')} sessões`}
                  />
                  <AccountKpiCard
                    icon={Eye}
                    label="Páginas vistas"
                    value={Math.round(ga4.totals.pageViews).toLocaleString('pt-BR')}
                  />
                  <AccountKpiCard
                    icon={Trophy}
                    label="Conversões"
                    value={Math.round(ga4.totals.conversions).toLocaleString('pt-BR')}
                    subtitle="Eventos principais"
                  />
                  <AccountKpiCard
                    icon={Sparkles}
                    label="Engajamento"
                    value={`${(ga4.totals.avgEngagement * 100).toFixed(1)}%`}
                  />
                </div>

                <Card className="shadow-card hover:shadow-elegant transition-all duration-200">
                  <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Visitantes diários
                    </CardTitle>
                    <span className="text-xs text-muted-foreground font-numeric">{periodLabel}</span>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <RechartsContainer width="100%" height="100%">
                        <AreaChart
                          data={ga4.snapshots.map((s) => ({
                            date: s.captured_date,
                            users: Number(s.total_users ?? 0),
                          }))}
                          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient id="ga4UsersGradient" x1="0" y1="0" x2="0" y2="1">
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
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <RTooltip content={<ChartTooltip unit="visitantes" />} />
                          <Area
                            type="monotone"
                            dataKey="users"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2.5}
                            fill="url(#ga4UsersGradient)"
                            dot={false}
                            activeDot={{ fill: 'hsl(var(--primary))', r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                          />
                        </AreaChart>
                      </RechartsContainer>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Origem do tráfego
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const list = topEntries(ga4.dimensions?.sources_breakdown ?? null, 6);
                        if (list.length === 0) {
                          return <p className="text-sm text-muted-foreground">Sem dados ainda.</p>;
                        }
                        return (
                          <ul className="space-y-3">
                            {list.map((e) => (
                              <li key={e.key} className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2 text-sm">
                                  <span className="font-medium truncate capitalize">{e.key}</span>
                                  <span className="text-xs text-muted-foreground font-numeric shrink-0">
                                    {e.value.toLocaleString('pt-BR')} · {e.pct.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full bg-orange-500 rounded-full transition-all duration-500"
                                    style={{ width: `${e.pct}%` }}
                                  />
                                </div>
                              </li>
                            ))}
                          </ul>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Top páginas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const pages = (ga4.dimensions?.top_pages ?? []).slice(0, 6);
                        if (pages.length === 0) {
                          return <p className="text-sm text-muted-foreground">Sem dados ainda.</p>;
                        }
                        return (
                          <ul className="space-y-2">
                            {pages.map((p, idx) => (
                              <li
                                key={`${p.path}-${idx}`}
                                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card hover:bg-muted/30 px-3 py-2.5 transition-colors"
                              >
                                <span className="text-xs font-mono truncate text-foreground" title={p.path}>
                                  {p.path}
                                </span>
                                <span className="text-sm font-semibold font-numeric shrink-0">
                                  {Number(p.views ?? 0).toLocaleString('pt-BR')}
                                </span>
                              </li>
                            ))}
                          </ul>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </>
        )}

        {/* ===== Conteúdos publicados (existente) ===== */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Performance dos conteúdos
          </h2>
          <span className="text-xs text-muted-foreground font-numeric">
            {periodLabel}
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
