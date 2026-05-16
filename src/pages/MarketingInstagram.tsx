import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Instagram, RefreshCw, Plug, Images, ArrowRight } from 'lucide-react';

import { PeriodPicker, type PeriodPreset, type PeriodDateRange } from '@/components/Marketing/PeriodPicker';
import { resolvePeriod, resolvePrevRange, pctChange } from '@/lib/marketing-dashboard-utils';
import { useMarketingIntegrations } from '@/hooks/useMarketingIntegrations';
import { useMarketingAccountSnapshots } from '@/hooks/useMarketingAccountSnapshots';
import { useMarketingPostMetrics, type PostWithMetrics } from '@/hooks/useMarketingPostMetrics';
import { InstagramIdentityBanner } from '@/components/Marketing/dashboard/InstagramIdentityBanner';
import { AccountKpisSection } from '@/components/Marketing/dashboard/AccountKpisSection';
import { EmptyState } from '@/ds/components/EmptyState';

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
  } = useMarketingAccountSnapshots(snapshotsRange, { includeAudience: false, limit: 90 });

  const [syncing, setSyncing] = useState(false);

  const accountKpis = useMemo(() => {
    if (!accountSnapshots || accountSnapshots.length === 0) return null;
    const sumKey = (arr: typeof accountSnapshots, key: 'reach_day' | 'views_day') =>
      arr.reduce((s, snap) => s + (snap[key] ?? 0), 0);
    const followersDeltaPeriod = accountSnapshots.reduce((s, snap) => s + (snap.followers_delta ?? 0), 0);
    const reachPeriod = sumKey(accountSnapshots, 'reach_day');
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
      newPostsPeriod,
    };
  }, [accountSnapshots, latestAccount]);

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
      <div className="ds-shell ds-page">
        <div className="ds-page-inner">
          <div className="ph">
            <div>
              <h1 className="ph-title">Instagram.</h1>
              <p className="ph-sub">Métricas detalhadas da conta @hirofilm.</p>
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
            <EmptyState
              icon={Plug}
              title="Conecte o Instagram para ver dados em tempo real"
              description="Configure a integração em Admin → Integrações de Marketing."
              action={
                <button className="btn primary" onClick={() => navigate('/administracao/integracoes')} type="button">
                  <span>Ir para Integrações</span>
                </button>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <div className="ph">
          <div>
            <h1 className="ph-title">Instagram.</h1>
            <p className="ph-sub">Visão geral da conta Instagram.</p>
          </div>
          <div className="ph-actions" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <PeriodPicker
              preset={periodPreset}
              customRange={customRange}
              oldestSnapshotDate={oldestAccount?.captured_at ? new Date(oldestAccount.captured_at) : null}
              onPresetChange={(p) => {
                if (p === 'custom') setCustomPickerOpen(true);
                else { setPeriodPreset(p); setCustomRange(null); }
              }}
              onCustomRangeChange={(range) => {
                setCustomRange(range);
                setPeriodPreset('custom');
                setCustomPickerOpen(false);
              }}
              customPickerOpen={customPickerOpen}
              onCustomPickerOpenChange={setCustomPickerOpen}
            />
            <button className="btn primary" onClick={handleSync} disabled={syncing} type="button">
              <RefreshCw size={14} strokeWidth={1.5} className={syncing ? 'animate-spin' : ''} />
              <span>{syncing ? 'Sincronizando…' : 'Sincronizar agora'}</span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <InstagramIdentityBanner
            integration={instagramIntegration}
            rightAction={
              <button className="btn" onClick={() => navigate('/marketing/dashboard')} type="button">
                <span>Ver dados completos</span>
                <ArrowRight size={14} strokeWidth={1.5} />
              </button>
            }
          />

          <AccountKpisSection
            accountSnapshotsLength={accountSnapshots.length}
            accountLoading={accountLoading}
            latestAccount={latestAccount}
            accountKpis={accountKpis}
            onSync={handleSync}
          />

          <section className="section">
            <div className="section-head">
              <div className="section-head-l">
                <span className="section-eyebrow">Recentes</span>
                <span className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Images size={14} strokeWidth={1.5} />
                  Posts recentes
                </span>
              </div>
              <button
                className="btn"
                onClick={() => navigate('/marketing/social-media/instagram/posts')}
                type="button"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span>Ver todos</span>
                <ArrowRight size={14} strokeWidth={1.5} />
              </button>
            </div>

            {recentPosts.length === 0 ? (
              <EmptyState
                icon={Images}
                title="Nenhum post publicado ainda"
                description="Quando você publicar posts no Instagram eles aparecerão aqui."
                variant="bare"
                action={
                  <button
                    className="btn primary"
                    onClick={() => navigate('/marketing/social-media/instagram/posts')}
                    type="button"
                  >
                    <span>Ir para Posts</span>
                  </button>
                }
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {recentPosts.slice(0, 10).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate('/marketing/social-media/instagram/posts')}
                    type="button"
                    style={{
                      position: 'relative', aspectRatio: '1 / 1',
                      border: '1px solid hsl(var(--ds-line-1))',
                      background: 'hsl(var(--ds-surface))',
                      overflow: 'hidden', cursor: 'pointer',
                    }}
                    className="group"
                  >
                    {p.cover_url ? (
                      <img
                        src={p.cover_url}
                        alt={p.title}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'hsl(var(--ds-fg-4))' }}>
                        <Instagram size={20} strokeWidth={1.5} />
                      </div>
                    )}
                    <div style={{
                      position: 'absolute', insetInline: 0, bottom: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                      padding: 8,
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 500, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                        {(p.views ?? 0).toLocaleString('pt-BR')} views
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
