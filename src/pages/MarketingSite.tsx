import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Globe, RefreshCw, Plug, BarChart3, Users, Eye, FileText,
  TrendingDown, Target, MapPin,
  ExternalLink, ArrowRight,
} from 'lucide-react';

const SITE_URL = 'https://hiro.film';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { EmptyState } from '@/components/ui/empty-state';
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
      <ResponsiveContainer maxWidth="7xl">
        <PageHeader title="Site" subtitle="Métricas detalhadas do tráfego do site" />
        <EmptyState
          icon={Plug}
          title="Conecte o Google Analytics para ver dados do site"
          description="Configure a integração em Admin → Integrações de Marketing."
          action={{ label: 'Ir para Integrações', onClick: () => navigate('/administracao/integracoes') }}
        />
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader
        title="Site"
        subtitle="hiro.film via Google Analytics"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <PeriodPicker
              preset={periodPreset}
              customRange={customRange}
              oldestSnapshotDate={null}
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
        {/* Banner de identidade (igual Instagram) */}
        <SiteIdentityBanner
          integration={ga4Integration}
          domain="hiro.film"
          rightAction={
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/marketing/dashboard')}
              className="gap-2"
            >
              Ver dados completos
              <ArrowRight className="h-4 w-4" />
            </Button>
          }
        />

        {/* Reusa a section de tráfego com KPIs e gráficos */}
        <Ga4TrafficSection ga4={ga4} periodLabel={periodLabel} />

        {/* KPIs adicionais: tempo médio, bounce, conversões */}
        {ga4.loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : ga4.snapshots.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Top exit pages
              <span className="text-xs font-normal text-muted-foreground">— onde estão saindo</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {exitPages.length === 0 ? (
              <EmptyState
                icon={TrendingDown}
                title="Sem dados de exit pages ainda"
                description="Os dados serão preenchidos na próxima sincronização (diária às 8h UTC)."
              />
            ) : (
              <div className="space-y-2">
                {exitPages.slice(0, 8).map((p) => (
                  <div
                    key={p.path}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition"
                  >
                    <code className="text-xs font-mono text-foreground truncate">{p.path}</code>
                    <div className="flex items-center gap-4 text-xs flex-shrink-0">
                      <span className="text-muted-foreground">
                        {p.exits.toLocaleString('pt-BR')} saídas
                      </span>
                      <span className={cn(
                        'font-numeric font-semibold',
                        p.exit_rate > 0.7 ? 'text-destructive' : p.exit_rate > 0.4 ? 'text-amber-500' : 'text-muted-foreground'
                      )}>
                        {(p.exit_rate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversion events */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-500" />
              Eventos de conversão
              <span className="text-xs font-normal text-muted-foreground">— cliques em WhatsApp, contato, etc</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conversionEvents.length === 0 ? (
              <EmptyState
                icon={Target}
                title="Nenhum evento de conversão capturado"
                description="Configure eventos como 'click_whatsapp' ou 'generate_lead' no GA4 para vê-los aqui."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {conversionEvents.slice(0, 10).map((e) => (
                  <div
                    key={e.event_name}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
                  >
                    <span className="text-sm font-medium text-foreground truncate">{e.event_name}</span>
                    <span className="text-sm font-numeric font-semibold text-emerald-600 dark:text-emerald-400">
                      {e.count.toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Países */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              Origem geográfica
              <span className="text-xs font-normal text-muted-foreground">— sessões por país</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {countriesEntries.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="Sem dados geográficos ainda"
                description="Os dados serão preenchidos na próxima sincronização."
              />
            ) : (
              <div className="space-y-2">
                {countriesEntries.map(([country, sessions]) => {
                  const pct = totalCountrySessions > 0 ? (sessions / totalCountrySessions) * 100 : 0;
                  return (
                    <div key={country} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{country}</span>
                        <span className="text-muted-foreground font-numeric">
                          {sessions.toLocaleString('pt-BR')} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500/70 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        {/* Preview do Site */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Preview de hiro.film
              <span className="text-xs font-normal text-muted-foreground">— visualização em tempo real</span>
            </CardTitle>
            <a
              href={SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition"
            >
              Abrir em nova aba <ExternalLink className="h-3 w-3" />
            </a>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden border border-border bg-muted relative">
              <iframe
                src={SITE_URL}
                title="Preview hiro.film"
                className="w-full h-[600px] bg-white"
                loading="lazy"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Se o preview não carregar, o site pode estar bloqueando exibição em iframe (proteção de segurança).
              Use o botão "Abrir em nova aba" acima.
            </p>
          </CardContent>
        </Card>
      </div>
    </ResponsiveContainer>
  );
}
