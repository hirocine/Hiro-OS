import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Globe, RefreshCw, Plug, Eye, TrendingDown, Target, MapPin,
  ExternalLink, ArrowRight, Users,
  type LucideIcon,
} from 'lucide-react';

const SITE_URL = 'https://hiro.film';
import { cn } from '@/lib/utils';

import { PeriodPicker, type PeriodPreset, type PeriodDateRange, PERIOD_OPTIONS } from '@/components/Marketing/PeriodPicker';
import { format as formatDate } from 'date-fns';
import { ptBR as ptBRLocale } from 'date-fns/locale';

import { resolvePeriod } from '@/lib/marketing-dashboard-utils';
import { useMarketingIntegrations } from '@/hooks/useMarketingIntegrations';
import { useMarketingGA4 } from '@/hooks/useMarketingGA4';
import { AccountKpiCard } from '@/components/Marketing/dashboard/AccountKpiCard';
import { Ga4TrafficSection } from '@/components/Marketing/dashboard/Ga4TrafficSection';
import { SiteIdentityBanner } from '@/components/Marketing/dashboard/SiteIdentityBanner';

const HN_DISPLAY: React.CSSProperties = { fontFamily: '"HN Display", sans-serif' };

function HairlineCard({
  icon: Icon,
  title,
  hint,
  right,
  children,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))' }}>
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid hsl(var(--ds-line-1))',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <Icon size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
          <span
            style={{
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 500,
              color: 'hsl(var(--ds-fg-2))',
            }}
          >
            {title}
          </span>
          {hint && (
            <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))' }}>— {hint}</span>
          )}
        </div>
        {right}
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

export default function MarketingSite() {
  const navigate = useNavigate();
  const { integrations, loading: integrationsLoading } = useMarketingIntegrations();
  const ga4Integration = integrations.find((i) => i.platform === 'google_analytics');
  const ga4Connected = ga4Integration?.status === 'connected';

  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('30');
  const [customRange, setCustomRange] = useState<PeriodDateRange | null>(null);
  const [customPickerOpen, setCustomPickerOpen] = useState(false);

  const resolvedRange = useMemo(() => resolvePeriod(periodPreset, customRange), [periodPreset, customRange]);
  const snapshotsRange = useMemo(() => {
    if (periodPreset === 'all') return { start: null, end: null };
    return { start: resolvedRange.start, end: resolvedRange.end };
  }, [periodPreset, resolvedRange]);

  const ga4 = useMarketingGA4(snapshotsRange);
  const [syncing, setSyncing] = useState(false);

  const periodLabel = useMemo(() => {
    if (periodPreset === 'all') return 'Todo o período';
    if (periodPreset === 'custom' && customRange) {
      return `${formatDate(customRange.start, 'dd/MM/yy', { locale: ptBRLocale })} → ${formatDate(customRange.end, 'dd/MM/yy', { locale: ptBRLocale })}`;
    }
    const preset = PERIOD_OPTIONS.find(o => o.value === periodPreset)?.label ?? '';
    const range = `${formatDate(resolvedRange.start, 'dd/MM', { locale: ptBRLocale })} → ${formatDate(resolvedRange.end, 'dd/MM', { locale: ptBRLocale })}`;
    return `${preset} · ${range}`;
  }, [periodPreset, customRange, resolvedRange]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await ga4.syncNow();
      toast.success('Google Analytics sincronizado');
    } catch (e) {
      toast.error('Falha ao sincronizar', {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSyncing(false);
    }
  };

  const exitPages = ga4.dimensions?.exit_pages ?? [];
  const conversionEvents = ga4.dimensions?.conversion_events ?? [];
  const countries = ga4.dimensions?.countries_breakdown ?? {};
  const countriesEntries = Object.entries(countries)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);
  const totalCountrySessions = countriesEntries.reduce((s, [, v]) => s + v, 0);

  if (!integrationsLoading && !ga4Connected) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner">
          <div className="ph">
            <div>
              <h1 className="ph-title">Site.</h1>
              <p className="ph-sub">Métricas detalhadas do tráfego do site.</p>
            </div>
          </div>
          <div className="empties" style={{ marginTop: 24 }}>
            <div className="empty" style={{ borderRight: 0 }}>
              <div className="glyph"><Plug strokeWidth={1.25} /></div>
              <h5>Conecte o Google Analytics para ver dados do site</h5>
              <p>Configure a integração em Admin → Integrações de Marketing.</p>
              <div className="actions">
                <button className="btn primary" onClick={() => navigate('/administracao/integracoes')} type="button">
                  <span>Ir para Integrações</span>
                </button>
              </div>
            </div>
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
            <h1 className="ph-title">Site.</h1>
            <p className="ph-sub">hiro.film via Google Analytics.</p>
          </div>
          <div className="ph-actions" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <PeriodPicker
              preset={periodPreset}
              customRange={customRange}
              oldestSnapshotDate={null}
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
              <RefreshCw size={14} strokeWidth={1.5} className={cn(syncing && 'animate-spin')} />
              <span>{syncing ? 'Sincronizando…' : 'Sincronizar agora'}</span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SiteIdentityBanner
            integration={ga4Integration}
            domain="hiro.film"
            rightAction={
              <button
                className="btn"
                onClick={() => navigate('/marketing/dashboard')}
                type="button"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span>Ver dados completos</span>
                <ArrowRight size={14} strokeWidth={1.5} />
              </button>
            }
          />

          {/* Reusa a section de tráfego com KPIs e gráficos */}
          <Ga4TrafficSection ga4={ga4} periodLabel={periodLabel} />

          {/* KPIs adicionais */}
          {ga4.loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    border: '1px solid hsl(var(--ds-line-1))',
                    background: 'hsl(var(--ds-surface))',
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    minHeight: 110,
                  }}
                >
                  <span className="sk line" style={{ width: '40%' }} />
                  <span className="sk line lg" style={{ width: '50%' }} />
                  <span className="sk line" style={{ width: '60%' }} />
                </div>
              ))}
            </div>
          ) : ga4.snapshots.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <AccountKpiCard
                icon={Eye}
                label="Duração média"
                value={formatDuration(ga4.totals.avgDuration)}
                subtitle={periodLabel}
              />
              <AccountKpiCard
                icon={TrendingDown}
                label="Taxa de rejeição"
                value={`${(ga4.totals.avgBounce * 100).toFixed(1)}%`}
                subtitle={periodLabel}
              />
              <AccountKpiCard
                icon={Users}
                label="Engajamento"
                value={`${(ga4.totals.avgEngagement * 100).toFixed(1)}%`}
                subtitle={periodLabel}
              />
              <AccountKpiCard
                icon={Target}
                label="Conversões"
                value={ga4.totals.conversions.toLocaleString('pt-BR')}
                subtitle={periodLabel}
              />
            </div>
          )}

          {/* Exit pages */}
          <HairlineCard icon={TrendingDown} title="Top exit pages" hint="onde estão saindo">
            {exitPages.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'hsl(var(--ds-fg-3))', fontSize: 13 }}>
                <TrendingDown size={28} strokeWidth={1.25} style={{ margin: '0 auto 8px', display: 'block' }} />
                <div style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-2))', marginBottom: 4 }}>Sem dados de exit pages ainda</div>
                <div>Os dados serão preenchidos na próxima sincronização (diária às 8h UTC).</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {exitPages.slice(0, 8).map((p) => {
                  const tone =
                    p.exit_rate > 0.7
                      ? 'hsl(var(--ds-danger))'
                      : p.exit_rate > 0.4
                        ? 'hsl(var(--ds-warning))'
                        : 'hsl(var(--ds-fg-3))';
                  return (
                    <div
                      key={p.path}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '8px 12px',
                        background: 'hsl(var(--ds-line-2) / 0.3)',
                        border: '1px solid hsl(var(--ds-line-1))',
                      }}
                    >
                      <code
                        style={{
                          fontSize: 12,
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                          color: 'hsl(var(--ds-fg-1))',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.path}
                      </code>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, flexShrink: 0 }}>
                        <span style={{ color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
                          {p.exits.toLocaleString('pt-BR')} saídas
                        </span>
                        <span style={{ color: tone, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                          {(p.exit_rate * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </HairlineCard>

          {/* Conversion events */}
          <HairlineCard icon={Target} title="Eventos de conversão" hint="cliques em WhatsApp, contato, etc">
            {conversionEvents.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'hsl(var(--ds-fg-3))', fontSize: 13 }}>
                <Target size={28} strokeWidth={1.25} style={{ margin: '0 auto 8px', display: 'block' }} />
                <div style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-2))', marginBottom: 4 }}>Nenhum evento de conversão capturado</div>
                <div>Configure eventos como 'click_whatsapp' ou 'generate_lead' no GA4 para vê-los aqui.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {conversionEvents.slice(0, 10).map((e) => (
                  <div
                    key={e.event_name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '8px 12px',
                      background: 'hsl(var(--ds-success) / 0.06)',
                      border: '1px solid hsl(var(--ds-success) / 0.2)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'hsl(var(--ds-fg-1))',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {e.event_name}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'hsl(var(--ds-success))',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {e.count.toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </HairlineCard>

          {/* Países */}
          <HairlineCard icon={MapPin} title="Origem geográfica" hint="sessões por país">
            {countriesEntries.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'hsl(var(--ds-fg-3))', fontSize: 13 }}>
                <MapPin size={28} strokeWidth={1.25} style={{ margin: '0 auto 8px', display: 'block' }} />
                <div style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-2))', marginBottom: 4 }}>Sem dados geográficos ainda</div>
                <div>Os dados serão preenchidos na próxima sincronização.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {countriesEntries.map(([country, sessions]) => {
                  const pct = totalCountrySessions > 0 ? (sessions / totalCountrySessions) * 100 : 0;
                  return (
                    <div key={country} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>{country}</span>
                        <span style={{ color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
                          {sessions.toLocaleString('pt-BR')} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div
                        style={{
                          height: 6,
                          background: 'hsl(var(--ds-line-2) / 0.3)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: 'hsl(var(--ds-info) / 0.7)',
                            transition: 'width 0.3s',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </HairlineCard>

          {/* Preview do Site */}
          <HairlineCard
            icon={Globe}
            title="Preview de hiro.film"
            hint="visualização em tempo real"
            right={
              <a
                href={SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12,
                  color: 'hsl(var(--ds-fg-3))',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--ds-fg-1))')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--ds-fg-3))')}
              >
                Abrir em nova aba <ExternalLink size={12} strokeWidth={1.5} />
              </a>
            }
          >
            <div
              style={{
                overflow: 'hidden',
                border: '1px solid hsl(var(--ds-line-1))',
                background: 'hsl(var(--ds-line-2) / 0.3)',
                position: 'relative',
              }}
            >
              <iframe
                src={SITE_URL}
                title="Preview hiro.film"
                style={{ width: '100%', height: 600, background: '#fff', border: 0, display: 'block' }}
                loading="lazy"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
            <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 8, textAlign: 'center', ...HN_DISPLAY }}>
              Se o preview não carregar, o site pode estar bloqueando exibição em iframe (proteção de segurança).
              Use o botão "Abrir em nova aba" acima.
            </p>
          </HairlineCard>
        </div>
      </div>
    </div>
  );
}
