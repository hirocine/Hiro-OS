import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer as RechartsContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { ArrowDown, ArrowUp, Image as ImageIcon, Minus, AlertTriangle, Sparkles, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMarketingPostMetrics, type PostWithMetrics } from '@/hooks/useMarketingPostMetrics';
import { getPillarColor } from '@/lib/marketing-colors';
import { POST_FORMATS, getPostPlatformLabel, getPostFormatLabel } from '@/lib/marketing-posts-config';
import { supabase } from '@/integrations/supabase/client';

type Period = '7' | '30' | '90' | 'this_month' | 'last_month';

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

interface DailySnapshot {
  date: string; // yyyy-mm-dd
  views: number;
}

export default function MarketingDashboard() {
  const { publishedPosts, pillars, loading } = useMarketingPostMetrics();
  const [period, setPeriod] = useState<Period>('30');
  const [snapshots, setSnapshots] = useState<DailySnapshot[]>([]);

  const range = useMemo(() => getRange(period), [period]);

  // posts in current/prev range, by scheduled_at (publish date)
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

  // Snapshots for the line chart (views per day) - aggregate latest per post per day? Sum.
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

    // Days since last published (from all publishedPosts)
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

    // Engagement drop
    const engChange = pctChange(kpis.engCurr, kpis.engPrev);
    if (engChange !== null && engChange < -10) {
      list.push({
        icon: <ArrowDown className="h-4 w-4 text-red-500" />,
        text: `Engajamento caiu ${Math.abs(engChange).toFixed(1)}% vs período anterior`,
        tone: 'warn',
      });
    }

    // Pillar below target
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

    // Best post
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

  // Empty state — no published posts at all
  if (!loading && publishedPosts.length === 0) {
    return (
      <ResponsiveContainer maxWidth="7xl">
        <PageHeader title="Dashboard de Marketing" subtitle="KPIs consolidados, evolução e top conteúdos." />
        <Card>
          <CardContent className="p-12 flex flex-col items-center text-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <CalendarIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Publique seu primeiro post para ver métricas aqui</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Quando você marcar posts como "Publicado" e adicionar métricas, esta tela vai consolidar a performance.
              </p>
            </div>
            <Button asChild>
              <Link to="/marketing">Ir ao Calendário</Link>
            </Button>
          </CardContent>
        </Card>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader
        title="Dashboard de Marketing"
        subtitle="KPIs consolidados, evolução e top conteúdos."
        actions={
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="space-y-6">
        {/* KPIs */}
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

        {/* Evolution chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolução de views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {snapshots.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  Sem snapshots no período. As métricas começam a gerar histórico ao serem atualizadas.
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
                      labelFormatter={(v) =>
                        new Date(v + 'T12:00:00').toLocaleDateString('pt-BR')
                      }
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

        {/* Top 5 + Platform */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top 5 posts</CardTitle>
            </CardHeader>
            <CardContent>
              {topPosts.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  Nenhum post publicado no período.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {topPosts.map((p, i) => (
                    <li key={p.id} className="flex items-center gap-3 py-2.5">
                      <span className="w-5 text-xs text-muted-foreground tabular-nums">
                        {i + 1}
                      </span>
                      {p.cover_url ? (
                        <img src={p.cover_url} alt={p.title} className="h-10 w-10 rounded-md object-cover" />
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
                <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                  Sem dados.
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

        {/* Pillar / Format / Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Performance por pilar</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {pillarPerformance.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                  Sem dados de pilares.
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
                        <td className="px-4 py-2 text-right tabular-nums">
                          {r.avgEng.toFixed(2)}%
                        </td>
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
                <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                  Sem dados de formatos.
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
                        <td className="px-4 py-2 text-right tabular-nums">
                          {r.avgEng.toFixed(2)}%
                        </td>
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
                <div className="text-sm text-muted-foreground py-6 text-center">
                  Tudo certo por aqui ✨
                </div>
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
      </div>
    </ResponsiveContainer>
  );
}
