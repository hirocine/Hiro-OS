import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, Eye, FileText, Globe, Trophy, Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { AccountKpiCard } from './AccountKpiCard';
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer as RechartsContainer,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { fmtChartDate, topEntries } from '@/lib/marketing-dashboard-utils';
import type { useMarketingGA4 } from '@/hooks/useMarketingGA4';

type Ga4Data = ReturnType<typeof useMarketingGA4>;

interface Props {
  ga4: Ga4Data;
  periodLabel: string;
}

export function Ga4TrafficSection({ ga4, periodLabel }: Props) {
  return (
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

      {ga4.loading ? (
        <>
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
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </>
      ) : ga4.snapshots.length === 0 ? (
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
  );
}
