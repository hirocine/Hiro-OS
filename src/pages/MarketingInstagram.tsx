import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Instagram, RefreshCw, Plug, Images, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

import { PeriodPicker, type PeriodPreset, type PeriodDateRange } from '@/components/Marketing/PeriodPicker';

import { resolvePeriod, resolvePrevRange, pctChange } from '@/lib/marketing-dashboard-utils';
import { useMarketingIntegrations } from '@/hooks/useMarketingIntegrations';
import { useMarketingAccountSnapshots } from '@/hooks/useMarketingAccountSnapshots';
import { useMarketingPostMetrics, type PostWithMetrics } from '@/hooks/useMarketingPostMetrics';

import { InstagramIdentityBanner } from '@/components/Marketing/dashboard/InstagramIdentityBanner';
import { AccountKpisSection } from '@/components/Marketing/dashboard/AccountKpisSection';

export default function MarketingInstagram() {
  const navigate = useNavigate();
  const { instagramConnected, instagram: instagramIntegration, loading: integrationsLoading, fetchIntegrations } = useMarketingIntegrations();
  const { publishedPosts } = useMarketingPostMetrics();

  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('30');
  const [customRange, setCustomRange] = useState<PeriodDateRange | null>(null);
  const [customPickerOpen, setCustomPickerOpen] = useState(false);

  const resolvedRange = useMemo(() => resolvePeriod(periodPreset, customRange), [periodPreset, customRange]);
  const snapshotsRange = useMemo(() => {
    if (periodPreset === 'all') return { start: null, end: null };
    return { start: resolvedRange.start, end: resolvedRange.end };
  }, [periodPreset, resolvedRange]);
  const prevRange = useMemo(() => resolvePrevRange(resolvedRange), [resolvedRange]);

  const {
    snapshots: accountSnapshots,
    latest: latestAccount,
    oldest: oldestAccount,
    loading: accountLoading,
    syncNow,
  } = useMarketingAccountSnapshots(snapshotsRange);

  const [syncing, setSyncing] = useState(false);

  const accountKpis = useMemo(() => {
    if (!accountSnapshots || accountSnapshots.length === 0) return null;
    const sumKey = (arr: typeof accountSnapshots, key: 'reach_day' | 'views_day' | 'profile_views_day') =>
      arr.reduce((s, snap) => s + (snap[key] ?? 0), 0);
    const followersDeltaPeriod = accountSnapshots.reduce((s, snap) => s + (snap.followers_delta ?? 0), 0);
    const reachPeriod = sumKey(accountSnapshots, 'reach_day');
    const profileViewsPeriod = sumKey(accountSnapshots, 'profile_views_day');
    const firstInPeriod = accountSnapshots[0];
    const newPostsPeriod =
      latestAccount && firstInPeriod &&
      latestAccount.media_count != null && firstInPeriod.media_count != null
        ? Math.max(0, latestAccount.media_count - firstInPeriod.media_count)
        : 0;
    return {
      followersDeltaPeriod,
      reachPeriod,
      reachChange: pctChange(reachPeriod, 0),
      profileViewsPeriod,
      profileViewsChange: pctChange(profileViewsPeriod, 0),
      newPostsPeriod,
    };
  }, [accountSnapshots, latestAccount, prevRange]);

  const recentPosts = useMemo<PostWithMetrics[]>(
    () =>
      [...publishedPosts]
        .filter((p) => p.platform === 'instagram')
        .sort((a, b) => {
          const da = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
          const db = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
          return db - da;
        })
        .slice(0, 10),
    [publishedPosts]
  );

  const handleSync = async () => {
    try {
      setSyncing(true);
      await syncNow();
      await fetchIntegrations();
      toast.success('Conta Instagram sincronizada');
    } catch (e) {
      toast.error('Falha ao sincronizar', {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSyncing(false);
    }
  };

  if (!integrationsLoading && !instagramConnected) {
    return (
      <ResponsiveContainer maxWidth="7xl">
        <PageHeader title="Instagram" subtitle="Métricas detalhadas da conta @hirofilm" />
        <EmptyState
          icon={Plug}
          title="Conecte o Instagram para ver dados em tempo real"
          description="Configure a integração em Admin → Integrações de Marketing."
          action={{ label: 'Ir para Integrações', onClick: () => navigate('/administracao/integracoes') }}
        />
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader
        title="Instagram"
        subtitle="Visão geral da conta Instagram"
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
        <InstagramIdentityBanner
          integration={instagramIntegration}
          rightAction={
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/marketing/dashboard')}
              className="gap-2"
            >
              Ver dados completos
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          }
        />

        <AccountKpisSection
          accountSnapshotsLength={accountSnapshots.length}
          accountLoading={accountLoading}
          latestAccount={latestAccount}
          accountKpis={accountKpis}
          onSync={handleSync}
        />

        {/* Posts recentes preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Images className="h-4 w-4 text-primary" />
              Posts recentes
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => navigate('/marketing/social-media/instagram/posts')}
            >
              Ver todos
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentPosts.length === 0 ? (
              <EmptyState
                icon={Images}
                title="Nenhum post publicado ainda"
                description="Quando você publicar posts no Instagram eles aparecerão aqui."
                action={{
                  label: 'Ir para Posts',
                  onClick: () => navigate('/marketing/social-media/instagram/posts'),
                }}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {recentPosts.slice(0, 10).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate('/marketing/social-media/instagram/posts')}
                    className="group relative aspect-square rounded-lg overflow-hidden bg-muted border border-border hover:border-primary/50 transition"
                  >
                    {p.cover_url ? (
                      <img
                        src={p.cover_url}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Instagram className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-[10px] text-white font-medium truncate">
                        {(p.views ?? 0).toLocaleString('pt-BR')} views
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ResponsiveContainer>
  );
}
