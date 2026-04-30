import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Trophy,
  PieChart as PieIcon,
  Layers,
  Image as ImageIcon,
  CheckCircle,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { KpiCard } from './KpiCard';
import { ChartTooltip } from './ChartTooltip';
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer as RechartsContainer,
} from 'recharts';
import { pctChange, fmtChartDate, type DailySnapshot } from '@/lib/marketing-dashboard-utils';
import { getPillarColor } from '@/lib/marketing-colors';
import { getPostPlatformLabel } from '@/lib/marketing-posts-config';
import type { PostWithMetrics } from '@/hooks/useMarketingPostMetrics';

interface PillarRow {
  id: string;
  name: string;
  color: string;
  posts: number;
  views: number;
  eng: number;
  avgViews: number;
  avgEng: number;
}

interface FormatRow {
  key: string;
  label: string;
  posts: number;
  views: number;
  eng: number;
  avgViews: number;
  avgEng: number;
}

interface AlertItem {
  icon: React.ReactNode;
  text: string;
  tone: 'warn' | 'info' | 'success';
}

interface KpiData {
  countCurr: number;
  countPrev: number;
  viewsCurr: number;
  viewsPrev: number;
  engCurr: number;
  engPrev: number;
  followersCurr: number;
  followersPrev: number;
}

interface PlatformDataItem {
  name: string;
  key: string;
  value: number;
  color: string;
}

interface Props {
  loading: boolean;
  publishedPostsLength: number;
  topPosts: PostWithMetrics[];
  snapshots: DailySnapshot[];
  kpis: KpiData;
  platformData: PlatformDataItem[];
  pillarPerformance: PillarRow[];
  formatPerformance: FormatRow[];
  alerts: AlertItem[];
  periodLabel: string;
  onNavigate: (path: string) => void;
}

export function ContentPerformanceSection({
  loading,
  publishedPostsLength,
  topPosts,
  snapshots,
  kpis,
  platformData,
  pillarPerformance,
  formatPerformance,
  alerts,
  periodLabel,
  onNavigate,
}: Props) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-24" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Performance dos conteúdos
        </h2>
        <span className="text-xs text-muted-foreground font-numeric">
          {periodLabel}
        </span>
      </div>

      {!loading && publishedPostsLength === 0 ? (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              icon={BarChart3}
              title="Publique seu primeiro post para ver métricas aqui"
              description='Quando você marcar posts como "Publicado" e adicionar métricas, esta seção vai consolidar a performance.'
              action={{ label: 'Ir ao Calendário', onClick: () => onNavigate('/marketing') }}
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
                  <div className="h-full flex items-center justify-center px-4">
                    <EmptyState
                      compact
                      icon={CalendarIcon}
                      title=""
                      description={
                        publishedPostsLength === 0
                          ? 'Sem dados de evolução. Publique posts para começar a ver a curva.'
                          : 'Sem dados de evolução no período. Os números aparecem conforme posts são sincronizados.'
                      }
                    />
                  </div>
                ) : snapshots.length < 2 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-6 gap-2">
                    <CalendarIcon className="h-8 w-8 text-muted-foreground/60" />
                    <p className="text-sm font-medium text-foreground">
                      Construindo histórico de views
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      A API do Instagram não fornece histórico de views por dia.
                      O gráfico ganha forma à medida que cada dia é capturado pelo sistema.
                    </p>
                    <p className="text-xs text-muted-foreground font-numeric mt-1">
                      {snapshots.length}/7 dias coletados
                    </p>
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top 5 posts</CardTitle>
            </CardHeader>
            <CardContent>
              {topPosts.length === 0 ? (
                <div className="px-4 py-6">
                  <EmptyState
                    icon={Trophy}
                    title={publishedPostsLength === 0 ? 'Nenhum post publicado ainda' : 'Nenhum post no período'}
                    description={
                      publishedPostsLength === 0
                        ? 'Marque um post como "Publicado" para começar a rastrear performance.'
                        : `Você tem ${publishedPostsLength} post${publishedPostsLength === 1 ? '' : 's'} no total, mas nenhum no período selecionado. Tente expandir o período.`
                    }
                  />
                </div>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Performance por pilar</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {pillarPerformance.length === 0 ? (
                  <div className="px-4 py-6">
                    <EmptyState
                      icon={Layers}
                      title={publishedPostsLength > 0 ? 'Posts sem pilar atribuído' : 'Sem posts publicados ainda'}
                      description={
                        publishedPostsLength > 0
                          ? `Você tem ${publishedPostsLength} post${publishedPostsLength === 1 ? '' : 's'} publicado${publishedPostsLength === 1 ? '' : 's'} sem pilar. Edite os posts para classificá-los e ver a distribuição.`
                          : 'Quando você publicar posts e atribuir pilares, a distribuição aparece aqui.'
                      }
                      action={
                        publishedPostsLength > 0
                          ? { label: 'Ir aos posts', onClick: () => onNavigate('/marketing/social-media/calendario') }
                          : undefined
                      }
                    />
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
                  <div className="px-4 py-6">
                    <EmptyState
                      icon={ImageIcon}
                      title={publishedPostsLength > 0 ? 'Posts sem formato definido' : 'Sem posts publicados ainda'}
                      description={
                        publishedPostsLength > 0
                          ? `Você tem ${publishedPostsLength} post${publishedPostsLength === 1 ? '' : 's'} publicado${publishedPostsLength === 1 ? '' : 's'} sem formato. Edite os posts e selecione o formato (Reels, Carrossel, etc) para ver a performance.`
                          : 'Quando você publicar posts e definir o formato, a performance aparece aqui.'
                      }
                      action={
                        publishedPostsLength > 0
                          ? { label: 'Ir aos posts', onClick: () => onNavigate('/marketing/social-media/calendario') }
                          : undefined
                      }
                    />
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
    </>
  );
}
