import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Calendar, Plus, Trophy, Bell, CheckCircle,
  FileText, Eye, Heart, UserPlus, TrendingUp, TrendingDown, X, Minus,
} from 'lucide-react';
import { format, parseISO, subDays, isAfter, isBefore, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PostsCalendar } from '@/components/Marketing/PostsCalendar';
import { MarketingPostDialog } from '@/components/Marketing/MarketingPostDialog';
import { StrategyOverview } from '@/components/Marketing/StrategyOverview';
import { useMarketingPosts, type MarketingPost } from '@/hooks/useMarketingPosts';
import { useMarketingPillars } from '@/hooks/useMarketingPillars';
import { useMarketingActivePersona } from '@/hooks/useMarketingActivePersona';
import { getPillarColor } from '@/lib/marketing-colors';
import {
  POST_PLATFORMS, POST_STATUSES, getPostPlatformLabel,
} from '@/lib/marketing-posts-config';
import { cn } from '@/lib/utils';

function formatNumber(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`;
  return String(n);
}

function getPostTimestamp(p: MarketingPost): Date | null {
  const ref = p.metrics_updated_at || p.scheduled_at || p.updated_at;
  if (!ref) return null;
  try { return parseISO(ref); } catch { return null; }
}

function VariationBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        Sem comparação ainda
      </span>
    );
  }
  const diff = ((current - previous) / previous) * 100;
  if (!Number.isFinite(diff)) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        Sem comparação ainda
      </span>
    );
  }
  const up = diff >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs font-medium',
      up ? 'text-emerald-500' : 'text-red-500'
    )}>
      <Icon className="h-3 w-3" />
      <span className="font-numeric">{Math.abs(diff).toFixed(0)}%</span>
      <span className="text-muted-foreground font-normal ml-0.5">vs semana passada</span>
    </span>
  );
}

interface KpiProps {
  label: string;
  value: string | number;
  icon: typeof FileText;
  current: number;
  previous: number;
}

function KpiCard({ label, value, icon: Icon, current, previous }: KpiProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-semibold font-numeric">{value}</div>
        <VariationBadge current={current} previous={previous} />
      </CardContent>
    </Card>
  );
}

export default function MarketingHome() {
  const { posts, deletePost } = useMarketingPosts();
  const { pillars } = useMarketingPillars();
  const { persona: activePersona } = useMarketingActivePersona();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<MarketingPost | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>(undefined);

  const openCreate = (date?: Date) => {
    setEditingPost(null);
    setDefaultDate(date);
    setDialogOpen(true);
  };
  const openEdit = (p: MarketingPost) => {
    setEditingPost(p);
    setDefaultDate(undefined);
    setDialogOpen(true);
  };

  // Calendar filters
  const [platformFilter, setPlatformFilter] = useState<string>('');
  const [pillarFilter, setPillarFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filteredPosts = useMemo(() => posts.filter((p) => {
    if (platformFilter && p.platform !== platformFilter) return false;
    if (pillarFilter && p.pillar_id !== pillarFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    return true;
  }), [posts, platformFilter, pillarFilter, statusFilter]);

  const hasActiveFilter = !!(platformFilter || pillarFilter || statusFilter);
  const clearFilters = () => {
    setPlatformFilter('');
    setPillarFilter('');
    setStatusFilter('');
  };

  // === KPIs (last 7 days vs previous 7 days) ===
  const kpis = useMemo(() => {
    const now = new Date();
    const start7 = subDays(now, 7);
    const start14 = subDays(now, 14);
    const published = posts.filter((p) => p.status === 'publicado');

    const inRange = (p: MarketingPost, from: Date, to: Date) => {
      const d = getPostTimestamp(p);
      return d && isAfter(d, from) && isBefore(d, to);
    };

    const recent = published.filter((p) => inRange(p, start7, now));
    const prior = published.filter((p) => inRange(p, start14, start7));

    const sum = (arr: MarketingPost[], k: keyof MarketingPost) =>
      arr.reduce((acc, p) => acc + (Number(p[k]) || 0), 0);
    const avg = (arr: MarketingPost[], k: keyof MarketingPost) =>
      arr.length ? sum(arr, k) / arr.length : 0;

    return {
      posts: { current: recent.length, previous: prior.length },
      views: { current: sum(recent, 'views'), previous: sum(prior, 'views') },
      engagement: {
        current: avg(recent, 'engagement_rate'),
        previous: avg(prior, 'engagement_rate'),
      },
      followers: { current: sum(recent, 'new_followers'), previous: sum(prior, 'new_followers') },
    };
  }, [posts]);

  // === Top 5 posts ===
  const topPosts = useMemo(() => {
    return [...posts]
      .filter((p) => p.status === 'publicado')
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);
  }, [posts]);

  // === Upcoming posts ===
  const upcomingPosts = useMemo(() => {
    const now = new Date();
    return posts
      .filter((p) => (p.status === 'em_producao' || p.status === 'agendado') && p.scheduled_at && new Date(p.scheduled_at) >= now)
      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
      .slice(0, 5);
  }, [posts]);

  // === Pillar distribution ===
  const distribution = useMemo(() => {
    const published = posts.filter((p) => p.status === 'publicado');
    const total = published.length;
    return pillars.map((p) => {
      const count = published.filter((pp) => pp.pillar_id === p.id).length;
      const color = getPillarColor(p.color);
      return {
        id: p.id,
        name: p.name,
        value: count,
        pct: total > 0 ? (count / total) * 100 : 0,
        target: p.target_percentage ?? null,
        color: color.hex,
      };
    });
  }, [posts, pillars]);
  

  // === Posts publicados nos últimos 30 dias (para Estratégia) ===
  const postsThisMonth = useMemo(() => {
    const cutoff = subDays(new Date(), 30);
    return posts.filter((p) => {
      if (p.status !== 'publicado') return false;
      const d = getPostTimestamp(p);
      return d ? isAfter(d, cutoff) : false;
    });
  }, [posts]);

  // === Alerts ===
  const alerts = useMemo(() => {
    const list: { icon: string; text: string }[] = [];
    const now = new Date();
    const published = posts.filter((p) => p.status === 'publicado');

    // last published
    const lastPublished = published
      .map(getPostTimestamp)
      .filter((d): d is Date => !!d)
      .sort((a, b) => b.getTime() - a.getTime())[0];
    if (lastPublished) {
      const days = differenceInDays(now, lastPublished);
      if (days > 5) list.push({ icon: '⚠️', text: `Faz ${days} dias sem publicar` });
    }

    // engagement drop vs last 30 days
    const last30 = published.filter((p) => {
      const d = getPostTimestamp(p);
      return d && isAfter(d, subDays(now, 30)) && isAfter(d, subDays(now, 7)) === false ? false : !!d && isAfter(d, subDays(now, 30));
    });
    const last7 = published.filter((p) => {
      const d = getPostTimestamp(p);
      return d && isAfter(d, subDays(now, 7));
    });
    const prior = last30.filter((p) => !last7.includes(p));
    const avg = (arr: MarketingPost[]) =>
      arr.length ? arr.reduce((s, p) => s + (p.engagement_rate || 0), 0) / arr.length : 0;
    const avgRecent = avg(last7);
    const avgPrior = avg(prior);
    if (avgPrior > 0 && avgRecent < avgPrior) {
      const drop = ((avgPrior - avgRecent) / avgPrior) * 100;
      if (drop > 10) list.push({ icon: '📉', text: `Engajamento caiu ${drop.toFixed(0)}% vs mês passado` });
    }

    // pillar below target
    distribution.forEach((d) => {
      if (d.target && d.target > 0 && d.pct < d.target) {
        list.push({ icon: '🎯', text: `Pilar ${d.name} está abaixo da meta (${d.pct.toFixed(0)}% vs ${d.target}%)` });
      }
    });

    // viral post
    if (published.length >= 3) {
      const avgViews = published.reduce((s, p) => s + (p.views || 0), 0) / published.length;
      const viral = last7.find((p) => (p.views || 0) > avgViews * 2);
      if (viral) list.push({ icon: '✨', text: `Post em alta: ${viral.title}` });
    }

    return list;
  }, [posts, distribution]);

  return (
    <ResponsiveContainer>
      <div className="space-y-5">
        <PageHeader
          title="Marketing"
          subtitle="Centro de operações do conteúdo"
          actions={
            <Button onClick={() => openCreate()}>
              <Plus className="h-4 w-4 mr-2" /> Novo Post
            </Button>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="📝 Posts publicados"
            value={kpis.posts.current}
            icon={FileText}
            current={kpis.posts.current}
            previous={kpis.posts.previous}
          />
          <KpiCard
            label="👁️ Views totais"
            value={formatNumber(kpis.views.current)}
            icon={Eye}
            current={kpis.views.current}
            previous={kpis.views.previous}
          />
          <KpiCard
            label="❤️ Engajamento médio"
            value={`${kpis.engagement.current.toFixed(1)}%`}
            icon={Heart}
            current={kpis.engagement.current}
            previous={kpis.engagement.previous}
          />
          <KpiCard
            label="🚀 Novos seguidores"
            value={formatNumber(kpis.followers.current)}
            icon={UserPlus}
            current={kpis.followers.current}
            previous={kpis.followers.previous}
          />
        </div>

        {/* Calendário full-width */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendário de Posts
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Filtros:</span>
              <Select value={platformFilter || 'all'} onValueChange={(v) => setPlatformFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Plataforma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas plataformas</SelectItem>
                  {POST_PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={pillarFilter || 'all'} onValueChange={(v) => setPillarFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Pilar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos pilares</SelectItem>
                  {pillars.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  {POST_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilter && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
                  <X className="h-3 w-3 mr-1" /> Limpar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <PostsCalendar
              posts={filteredPosts}
              pillars={pillars}
              onCreate={openCreate}
              onEdit={openEdit}
              onDelete={deletePost}
            />
          </CardContent>
        </Card>

        {/* Estratégia ativa */}
        <StrategyOverview
          persona={activePersona}
          pillars={pillars}
          postsThisMonth={postsThisMonth}
        />

        {/* Insights grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Top 5 posts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4" /> Top 5 posts
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to="/marketing/social-media/calendario?view=ranking">
                  Ver ranking completo <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {topPosts.length === 0 ? (
                <EmptyState compact icon={Trophy} title="" description="Nenhum post publicado ainda" />
              ) : (
                <ul className="divide-y divide-border">
                  {topPosts.map((p, i) => (
                    <li key={p.id} className="flex items-center gap-3 py-2.5">
                      <span className="w-5 text-sm font-semibold text-muted-foreground font-numeric">{i + 1}</span>
                      {p.cover_url ? (
                        <img src={p.cover_url} alt="" className="w-10 h-10 rounded-md object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.title}</p>
                        {p.platform && (
                          <Badge variant="outline" className="text-[10px] mt-0.5">
                            {getPostPlatformLabel(p.platform)}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground font-numeric shrink-0">
                        {formatNumber(p.views || 0)} views
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Próximos posts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Próximos posts
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to="/marketing/dashboard">
                  Ver todos <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingPosts.length === 0 ? (
                <EmptyState compact icon={Calendar} title="" description="Nenhum post agendado. Use o calendário acima pra criar." />
              ) : (
                <ul className="divide-y divide-border">
                  {upcomingPosts.map((p) => {
                    const d = parseISO(p.scheduled_at!);
                    const pillar = pillars.find((pp) => pp.id === p.pillar_id);
                    const color = pillar ? getPillarColor(pillar.color) : null;
                    return (
                      <li key={p.id} className="flex items-center gap-3 py-2.5">
                        <div className="w-24 shrink-0 text-xs text-muted-foreground">
                          <span className="capitalize">{format(d, "EEE, dd/MM", { locale: ptBR })}</span>
                          <span className="block">às {format(d, "HH'h'", { locale: ptBR })}</span>
                        </div>
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color?.hex || 'hsl(var(--muted))' }}
                        />
                        {p.platform && (
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {getPostPlatformLabel(p.platform)}
                          </Badge>
                        )}
                        <p className="text-sm font-medium truncate flex-1">{p.title}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" /> Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <EmptyState compact icon={CheckCircle} title="" description="Tudo em ordem" />
              ) : (
                <ul className="space-y-2">
                  {alerts.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="shrink-0">{a.icon}</span>
                      <span className="flex-1">{a.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <MarketingPostDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        post={editingPost}
        defaultDate={defaultDate}
      />
    </ResponsiveContainer>
  );
}
