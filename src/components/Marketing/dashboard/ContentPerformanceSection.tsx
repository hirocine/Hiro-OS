import {
  BarChart3,
  Trophy,
  Layers,
  Image as ImageIcon,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { KpiCard } from './KpiCard';
import { ChartTooltip } from './ChartTooltip';
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
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

const cardWrap: React.CSSProperties = {
  border: '1px solid hsl(var(--ds-line-1))',
  background: 'hsl(var(--ds-surface))',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const cardWrapPadded: React.CSSProperties = {
  ...cardWrap,
  padding: '14px 18px',
};

const cardTitle: React.CSSProperties = {
  fontFamily: '"HN Display", sans-serif',
  fontSize: 14,
  fontWeight: 600,
  color: 'hsl(var(--ds-fg-1))',
};

const tableHeadCell: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  textAlign: 'left',
};

const tableCell: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 12,
  color: 'hsl(var(--ds-fg-2))',
  borderTop: '1px solid hsl(var(--ds-line-2))',
};

export function ContentPerformanceSection({
  loading,
  publishedPostsLength,
  topPosts,
  snapshots,
  kpis,
  pillarPerformance,
  formatPerformance,
  periodLabel,
  onNavigate,
}: Props) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="sk line" style={{ width: 200 }} />
          <span className="sk line" style={{ width: 80 }} />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} style={cardWrapPadded}>
            <span className="sk line" style={{ width: 160 }} />
            <span className="sk line" style={{ width: '100%' }} />
            <span className="sk line" style={{ width: '85%' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 8,
        }}
      >
        <h2
          style={{
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 500,
            color: 'hsl(var(--ds-fg-3))',
          }}
        >
          Performance dos conteúdos
        </h2>
        <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))', fontVariantNumeric: 'tabular-nums' }}>
          {periodLabel}
        </span>
      </div>

      {!loading && publishedPostsLength === 0 ? (
        <div className="empties">
          <div className="empty" style={{ borderRight: 0 }}>
            <div className="glyph">
              <BarChart3 strokeWidth={1.25} />
            </div>
            <h5>Publique seu primeiro post para ver métricas aqui</h5>
            <p>Quando você marcar posts como "Publicado" e adicionar métricas, esta seção vai consolidar a performance.</p>
            <div className="actions">
              <button className="btn primary" onClick={() => onNavigate('/marketing')} type="button">
                <span>Ir ao Calendário</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
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

          <div style={cardWrapPadded}>
            <span style={cardTitle}>Evolução de views</span>
            <div style={{ height: 240 }}>
              {snapshots.length === 0 ? (
                <div
                  style={{
                    height: '100%',
                    display: 'grid',
                    placeItems: 'center',
                    padding: 16,
                    textAlign: 'center',
                    color: 'hsl(var(--ds-fg-3))',
                    fontSize: 12,
                  }}
                >
                  {publishedPostsLength === 0
                    ? 'Sem dados de evolução. Publique posts para começar a ver a curva.'
                    : 'Sem dados de evolução no período. Os números aparecem conforme posts são sincronizados.'}
                </div>
              ) : snapshots.length < 2 ? (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: 24,
                    gap: 8,
                  }}
                >
                  <CalendarIcon size={28} strokeWidth={1.25} style={{ color: 'hsl(var(--ds-fg-4))' }} />
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                    Construindo histórico de views
                  </p>
                  <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', maxWidth: 360, lineHeight: 1.4 }}>
                    A API do Instagram não fornece histórico de views por dia. O gráfico ganha forma à
                    medida que cada dia é capturado pelo sistema.
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: 'hsl(var(--ds-fg-4))',
                      fontVariantNumeric: 'tabular-nums',
                      marginTop: 4,
                    }}
                  >
                    {snapshots.length}/7 dias coletados
                  </p>
                </div>
              ) : (
                <RechartsContainer width="100%" height="100%">
                  <AreaChart data={snapshots} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="postsViewsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--ds-accent))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--ds-accent))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--ds-line-2))" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'hsl(var(--ds-fg-4))' }}
                      tickFormatter={fmtChartDate}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v: number) => v.toLocaleString('pt-BR')}
                      tick={{ fontSize: 10, fill: 'hsl(var(--ds-fg-4))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RTooltip content={<ChartTooltip unit="views" />} />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="hsl(var(--ds-accent))"
                      strokeWidth={2}
                      fill="url(#postsViewsGradient)"
                      dot={false}
                      activeDot={{ fill: 'hsl(var(--ds-accent))', r: 5, strokeWidth: 2, stroke: 'hsl(var(--ds-surface))' }}
                    />
                  </AreaChart>
                </RechartsContainer>
              )}
            </div>
          </div>

          <div style={cardWrapPadded}>
            <span style={cardTitle}>Top 5 posts</span>
            {topPosts.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  textAlign: 'center',
                  color: 'hsl(var(--ds-fg-3))',
                  fontSize: 12,
                }}
              >
                <Trophy size={28} strokeWidth={1.25} style={{ margin: '0 auto 8px', display: 'block' }} />
                <div style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-2))', marginBottom: 4 }}>
                  {publishedPostsLength === 0 ? 'Nenhum post publicado ainda' : 'Nenhum post no período'}
                </div>
                <div>
                  {publishedPostsLength === 0
                    ? 'Marque um post como "Publicado" para começar a rastrear performance.'
                    : `Você tem ${publishedPostsLength} post${publishedPostsLength === 1 ? '' : 's'} no total, mas nenhum no período selecionado. Tente expandir o período.`}
                </div>
              </div>
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
                      borderTop: i === 0 ? 0 : '1px solid hsl(var(--ds-line-2))',
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        fontSize: 11,
                        color: 'hsl(var(--ds-fg-4))',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {i + 1}
                    </span>
                    {p.cover_url ? (
                      <img
                        src={p.cover_url}
                        alt={p.title}
                        style={{ width: 36, height: 36, objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          background: 'hsl(var(--ds-line-2))',
                          display: 'grid',
                          placeItems: 'center',
                          color: 'hsl(var(--ds-fg-4))',
                          flexShrink: 0,
                        }}
                      >
                        <ImageIcon size={14} strokeWidth={1.5} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'hsl(var(--ds-fg-1))',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.title}
                      </div>
                      {p.platform && (
                        <span className="pill muted" style={{ fontSize: 10, marginTop: 4 }}>
                          {getPostPlatformLabel(p.platform)}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'hsl(var(--ds-fg-1))',
                        fontVariantNumeric: 'tabular-nums',
                        flexShrink: 0,
                      }}
                    >
                      {(p.views ?? 0).toLocaleString('pt-BR')} views
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div style={cardWrap}>
              <div style={{ padding: '14px 18px', borderBottom: pillarPerformance.length === 0 ? 0 : '1px solid hsl(var(--ds-line-2))' }}>
                <span style={cardTitle}>Performance por pilar</span>
              </div>
              {pillarPerformance.length === 0 ? (
                <div
                  style={{
                    padding: 24,
                    textAlign: 'center',
                    color: 'hsl(var(--ds-fg-3))',
                    fontSize: 12,
                  }}
                >
                  <Layers size={28} strokeWidth={1.25} style={{ margin: '0 auto 8px', display: 'block' }} />
                  <div style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-2))', marginBottom: 4 }}>
                    {publishedPostsLength > 0 ? 'Posts sem pilar atribuído' : 'Sem posts publicados ainda'}
                  </div>
                  <div>
                    {publishedPostsLength > 0
                      ? `Você tem ${publishedPostsLength} post${publishedPostsLength === 1 ? '' : 's'} publicado${publishedPostsLength === 1 ? '' : 's'} sem pilar. Edite os posts para classificá-los e ver a distribuição.`
                      : 'Quando você publicar posts e atribuir pilares, a distribuição aparece aqui.'}
                  </div>
                  {publishedPostsLength > 0 && (
                    <button
                      type="button"
                      className="btn"
                      style={{ marginTop: 12 }}
                      onClick={() => onNavigate('/marketing/social-media/calendario')}
                    >
                      Ir aos posts
                    </button>
                  )}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={tableHeadCell}>Pilar</th>
                      <th style={{ ...tableHeadCell, textAlign: 'right' }}>Posts</th>
                      <th style={{ ...tableHeadCell, textAlign: 'right' }}>Views méd.</th>
                      <th style={{ ...tableHeadCell, textAlign: 'right' }}>Eng. %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pillarPerformance.map((r) => (
                      <tr key={r.id}>
                        <td style={tableCell}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: getPillarColor(r.color).hex,
                              }}
                            />
                            <span
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {r.name}
                            </span>
                          </div>
                        </td>
                        <td style={{ ...tableCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {r.posts}
                        </td>
                        <td style={{ ...tableCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {r.avgViews.toLocaleString('pt-BR')}
                        </td>
                        <td style={{ ...tableCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {r.avgEng.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={cardWrap}>
              <div style={{ padding: '14px 18px', borderBottom: formatPerformance.length === 0 ? 0 : '1px solid hsl(var(--ds-line-2))' }}>
                <span style={cardTitle}>Performance por formato</span>
              </div>
              {formatPerformance.length === 0 ? (
                <div
                  style={{
                    padding: 24,
                    textAlign: 'center',
                    color: 'hsl(var(--ds-fg-3))',
                    fontSize: 12,
                  }}
                >
                  <ImageIcon size={28} strokeWidth={1.25} style={{ margin: '0 auto 8px', display: 'block' }} />
                  <div style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-2))', marginBottom: 4 }}>
                    {publishedPostsLength > 0 ? 'Posts sem formato definido' : 'Sem posts publicados ainda'}
                  </div>
                  <div>
                    {publishedPostsLength > 0
                      ? `Você tem ${publishedPostsLength} post${publishedPostsLength === 1 ? '' : 's'} publicado${publishedPostsLength === 1 ? '' : 's'} sem formato. Edite os posts e selecione o formato (Reels, Carrossel, etc) para ver a performance.`
                      : 'Quando você publicar posts e definir o formato, a performance aparece aqui.'}
                  </div>
                  {publishedPostsLength > 0 && (
                    <button
                      type="button"
                      className="btn"
                      style={{ marginTop: 12 }}
                      onClick={() => onNavigate('/marketing/social-media/calendario')}
                    >
                      Ir aos posts
                    </button>
                  )}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={tableHeadCell}>Formato</th>
                      <th style={{ ...tableHeadCell, textAlign: 'right' }}>Posts</th>
                      <th style={{ ...tableHeadCell, textAlign: 'right' }}>Views méd.</th>
                      <th style={{ ...tableHeadCell, textAlign: 'right' }}>Eng. %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formatPerformance.map((r) => (
                      <tr key={r.key}>
                        <td style={tableCell}>{r.label}</td>
                        <td style={{ ...tableCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {r.posts}
                        </td>
                        <td style={{ ...tableCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {r.avgViews.toLocaleString('pt-BR')}
                        </td>
                        <td style={{ ...tableCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {r.avgEng.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
