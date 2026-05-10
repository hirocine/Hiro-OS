import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Calendar, Plus, Trophy, Bell, CheckCircle,
  FileText, Eye, Heart, UserPlus, TrendingUp, TrendingDown, X, Minus,
  type LucideIcon,
} from 'lucide-react';
import { format, parseISO, subDays, isAfter, isBefore, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

const HN_DISPLAY: React.CSSProperties = { fontFamily: '"HN Display", sans-serif' };

function HairlineCard({
  icon: Icon,
  title,
  right,
  children,
}: {
  icon: LucideIcon;
  title: string;
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
          flexWrap: 'wrap',
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
        </div>
        {right}
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}

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
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 11,
          color: 'hsl(var(--ds-fg-3))',
        }}
      >
        <Minus size={12} strokeWidth={1.5} />
        Sem comparação ainda
      </span>
    );
  }
  const diff = ((current - previous) / previous) * 100;
  if (!Number.isFinite(diff)) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 11,
          color: 'hsl(var(--ds-fg-3))',
        }}
      >
        <Minus size={12} strokeWidth={1.5} />
        Sem comparação ainda
      </span>
    );
  }
  const up = diff >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  const tone = up ? 'hsl(var(--ds-success))' : 'hsl(var(--ds-danger))';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 500,
        color: tone,
      }}
    >
      <Icon size={12} strokeWidth={1.5} />
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.abs(diff).toFixed(0)}%</span>
      <span style={{ color: 'hsl(var(--ds-fg-3))', fontWeight: 400, marginLeft: 2 }}>vs semana passada</span>
    </span>
  );
}

interface KpiProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  current: number;
  previous: number;
}

function KpiCard({ label, value, icon: Icon, current, previous }: KpiProps) {
  return (
    <div
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 500,
            color: 'hsl(var(--ds-fg-3))',
          }}
        >
          {label}
        </span>
        <Icon size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: 'hsl(var(--ds-fg-1))',
          fontVariantNumeric: 'tabular-nums',
          ...HN_DISPLAY,
        }}
      >
        {value}
      </div>
      <VariationBadge current={current} previous={previous} />
    </div>
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
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <div className="ph">
          <div>
            <h1 className="ph-title">Marketing.</h1>
            <p className="ph-sub">Centro de operações do conteúdo.</p>
          </div>
          <div className="ph-actions">
            <button className="btn primary" onClick={() => openCreate()} type="button">
              <Plus size={14} strokeWidth={1.5} />
              <span>Novo Post</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 24 }}>

          {/* KPIs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 12,
            }}
          >
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
          <HairlineCard
            icon={Calendar}
            title="Calendário de Posts"
            right={
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>Filtros:</span>
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
                  <button
                    type="button"
                    className="btn"
                    onClick={clearFilters}
                    style={{ height: 32, fontSize: 12 }}
                  >
                    <X size={12} strokeWidth={1.5} />
                    <span>Limpar</span>
                  </button>
                )}
              </div>
            }
          >
            <PostsCalendar
              posts={filteredPosts}
              pillars={pillars}
              onCreate={openCreate}
              onEdit={openEdit}
              onDelete={deletePost}
            />
          </HairlineCard>

          {/* Estratégia ativa */}
          <StrategyOverview
            persona={activePersona}
            pillars={pillars}
            postsThisMonth={postsThisMonth}
          />

          {/* Insights grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 16,
            }}
          >
            {/* Top 5 posts */}
            <HairlineCard
              icon={Trophy}
              title="Top 5 posts"
              right={
                <Link
                  to="/marketing/social-media/calendario?view=ranking"
                  className="btn"
                  style={{ height: 28, fontSize: 12, textDecoration: 'none' }}
                >
                  <span>Ver ranking</span>
                  <ArrowRight size={12} strokeWidth={1.5} />
                </Link>
              }
            >
              {topPosts.length === 0 ? (
                <EmptyState compact icon={Trophy} title="" description="Nenhum post publicado ainda" />
              ) : (
                <ul style={{ display: 'flex', flexDirection: 'column', margin: 0, padding: 0, listStyle: 'none' }}>
                  {topPosts.map((p, i) => (
                    <li
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 0',
                        borderBottom: i < topPosts.length - 1 ? '1px solid hsl(var(--ds-line-1))' : 'none',
                      }}
                    >
                      <span
                        style={{
                          width: 20,
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'hsl(var(--ds-fg-3))',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {i + 1}
                      </span>
                      {p.cover_url ? (
                        <img
                          src={p.cover_url}
                          alt=""
                          style={{
                            width: 40,
                            height: 40,
                            objectFit: 'cover',
                            flexShrink: 0,
                            border: '1px solid hsl(var(--ds-line-1))',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            background: 'hsl(var(--ds-line-2) / 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            border: '1px solid hsl(var(--ds-line-1))',
                          }}
                        >
                          <FileText size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: 'hsl(var(--ds-fg-1))',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {p.title}
                        </p>
                        {p.platform && (
                          <span className="pill muted" style={{ fontSize: 10, marginTop: 2 }}>
                            {getPostPlatformLabel(p.platform)}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          color: 'hsl(var(--ds-fg-3))',
                          fontVariantNumeric: 'tabular-nums',
                          flexShrink: 0,
                        }}
                      >
                        {formatNumber(p.views || 0)} views
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </HairlineCard>

            {/* Próximos posts */}
            <HairlineCard
              icon={Calendar}
              title="Próximos posts"
              right={
                <Link
                  to="/marketing/dashboard"
                  className="btn"
                  style={{ height: 28, fontSize: 12, textDecoration: 'none' }}
                >
                  <span>Ver todos</span>
                  <ArrowRight size={12} strokeWidth={1.5} />
                </Link>
              }
            >
              {upcomingPosts.length === 0 ? (
                <EmptyState compact icon={Calendar} title="" description="Nenhum post agendado. Use o calendário acima pra criar." />
              ) : (
                <ul style={{ display: 'flex', flexDirection: 'column', margin: 0, padding: 0, listStyle: 'none' }}>
                  {upcomingPosts.map((p, i) => {
                    const d = parseISO(p.scheduled_at!);
                    const pillar = pillars.find((pp) => pp.id === p.pillar_id);
                    const color = pillar ? getPillarColor(pillar.color) : null;
                    return (
                      <li
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 0',
                          borderBottom: i < upcomingPosts.length - 1 ? '1px solid hsl(var(--ds-line-1))' : 'none',
                        }}
                      >
                        <div
                          style={{
                            width: 88,
                            flexShrink: 0,
                            fontSize: 11,
                            color: 'hsl(var(--ds-fg-3))',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          <span style={{ textTransform: 'capitalize' }}>{format(d, "EEE, dd/MM", { locale: ptBR })}</span>
                          <span style={{ display: 'block' }}>às {format(d, "HH'h'", { locale: ptBR })}</span>
                        </div>
                        <span
                          style={{
                            height: 10,
                            width: 10,
                            borderRadius: '50%',
                            flexShrink: 0,
                            background: color?.hex || 'hsl(var(--ds-line-3))',
                          }}
                        />
                        {p.platform && (
                          <span className="pill muted" style={{ fontSize: 10, flexShrink: 0 }}>
                            {getPostPlatformLabel(p.platform)}
                          </span>
                        )}
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: 'hsl(var(--ds-fg-1))',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                          }}
                        >
                          {p.title}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </HairlineCard>

            <HairlineCard icon={Bell} title="Alertas">
              {alerts.length === 0 ? (
                <EmptyState compact icon={CheckCircle} title="" description="Tudo em ordem" />
              ) : (
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: 0, padding: 0, listStyle: 'none' }}>
                  {alerts.map((a, i) => (
                    <li
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        fontSize: 13,
                        color: 'hsl(var(--ds-fg-1))',
                      }}
                    >
                      <span style={{ flexShrink: 0 }}>{a.icon}</span>
                      <span style={{ flex: 1 }}>{a.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </HairlineCard>
          </div>
        </div>

        <MarketingPostDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          post={editingPost}
          defaultDate={defaultDate}
        />
      </div>
    </div>
  );
}
