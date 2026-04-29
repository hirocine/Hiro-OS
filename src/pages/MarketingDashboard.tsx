import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  ArrowDown,
  Sparkles,
  RefreshCw,
  Plug,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMarketingPostMetrics, type PostWithMetrics } from '@/hooks/useMarketingPostMetrics';
import { useMarketingAccountSnapshots } from '@/hooks/useMarketingAccountSnapshots';
import { useMarketingIntegrations } from '@/hooks/useMarketingIntegrations';
import { useMarketingGA4 } from '@/hooks/useMarketingGA4';
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
  PLATFORM_COLORS,
  type DailySnapshot,
} from '@/lib/marketing-dashboard-utils';

import { InstagramIdentityBanner } from '@/components/Marketing/dashboard/InstagramIdentityBanner';
import { SiteIdentityBanner } from '@/components/Marketing/dashboard/SiteIdentityBanner';
import { AccountKpisSection } from '@/components/Marketing/dashboard/AccountKpisSection';
import { AccountChartsSection } from '@/components/Marketing/dashboard/AccountChartsSection';
import { AudienceSection } from '@/components/Marketing/dashboard/AudienceSection';
import { Ga4TrafficSection } from '@/components/Marketing/dashboard/Ga4TrafficSection';
import { ContentPerformanceSection } from '@/components/Marketing/dashboard/ContentPerformanceSection';

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

  // ===== Account KPIs derived from accountSnapshots =====
  const accountKpis = useMemo(() => {
    if (!accountSnapshots || accountSnapshots.length === 0) return null;

    const sumKey = (arr: typeof accountSnapshots, key: 'reach_day' | 'views_day') =>
      arr.reduce((s, snap) => s + (snap[key] ?? 0), 0);

    const followersDeltaPeriod = accountSnapshots.reduce(
      (s, snap) => s + (snap.followers_delta ?? 0),
      0
    );

    const reachPeriod = sumKey(accountSnapshots, 'reach_day');
    const reachPrev = sumKey(prevAccountSnapshots, 'reach_day');

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
      newPostsPeriod,
    };
  }, [accountSnapshots, prevAccountSnapshots, latestAccount]);

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
      accountSnapshots.map((s) => ({
        date: s.captured_at.slice(0, 10),
        reach: s.reach_day,
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
        <InstagramIdentityBanner
          integration={instagramIntegration}
          rightAction={
            instagramConnected ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => navigate('/marketing/social-media/instagram')}
              >
                Ver dados completos
                <ArrowDown className="h-3.5 w-3.5 -rotate-90" />
              </Button>
            ) : undefined
          }
        />

        {/* KPIs principais da CONTA */}
        <AccountKpisSection
          accountSnapshotsLength={accountSnapshots.length}
          accountLoading={accountLoading}
          latestAccount={latestAccount}
          accountKpis={accountKpis}
          onSync={handleSync}
        />

        {accountSnapshots.length > 0 && (
          <>
            <AccountChartsSection
              followersSeries={followersSeries}
              reachSeries={reachSeries}
              periodLabel={periodLabel}
            />

            <AudienceSection
              audience={audience}
              syncingAudience={syncingAudience}
              onSyncAudience={handleSyncAudience}
            />
          </>
        )}

        {/* ===== Tráfego do site (GA4) ===== */}
        {ga4Connected && (
          <>
            {/* Banner com identidade do Site */}
            <SiteIdentityBanner
              integration={ga4Integration}
              rightAction={
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => navigate('/marketing/social-media/site')}
                >
                  Ver dados completos
                  <ArrowDown className="h-3.5 w-3.5 -rotate-90" />
                </Button>
              }
            />
            <Ga4TrafficSection ga4={ga4} periodLabel={periodLabel} />
          </>
        )}

        {/* ===== Conteúdos publicados ===== */}
        <ContentPerformanceSection
          loading={loading}
          publishedPostsLength={publishedPosts.length}
          topPosts={topPosts}
          snapshots={snapshots}
          kpis={kpis}
          platformData={platformData}
          pillarPerformance={pillarPerformance}
          formatPerformance={formatPerformance}
          alerts={alerts}
          periodLabel={periodLabel}
          onNavigate={navigate}
        />
      </div>
    </ResponsiveContainer>
  );
}
