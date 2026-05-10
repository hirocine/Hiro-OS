import { BarChart3, Users, Eye, FileText, Globe, Trophy, Sparkles, Smartphone } from 'lucide-react';
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

const cardWrap: React.CSSProperties = {
  border: '1px solid hsl(var(--ds-line-1))',
  background: 'hsl(var(--ds-surface))',
  padding: '14px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};

const cardTitle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
};

const ProgressBar = ({ pct, color }: { pct: number; color: string }) => (
  <div style={{ height: 4, background: 'hsl(var(--ds-line-2))', overflow: 'hidden' }}>
    <div
      style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, transition: 'width 0.5s' }}
    />
  </div>
);

export function Ga4TrafficSection({ ga4, periodLabel }: Props) {
  const accentWarning = 'hsl(var(--ds-warning))';

  if (ga4.loading) {
    return (
      <>
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
        <div style={cardWrap}>
          <span className="sk line" style={{ width: 160 }} />
          <span className="sk line lg" style={{ height: 200 }} />
        </div>
      </>
    );
  }

  if (ga4.snapshots.length === 0) {
    return (
      <div className="empties">
        <div className="empty" style={{ borderRight: 0 }}>
          <div className="glyph">
            <BarChart3 strokeWidth={1.25} />
          </div>
          <h5>Aguardando primeiros dados do GA4</h5>
          <p>A sincronização roda diariamente às 8h UTC. Você também pode sincronizar manualmente no topo da página.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
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

      <div style={cardWrap}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={cardTitle}>
            <Users size={13} strokeWidth={1.5} />
            Visitantes diários
          </span>
          <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))', fontVariantNumeric: 'tabular-nums' }}>
            {periodLabel}
          </span>
        </div>
        <div style={{ height: 240 }}>
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
              <RTooltip content={<ChartTooltip unit="visitantes" />} />
              <Area
                type="monotone"
                dataKey="users"
                stroke="hsl(var(--ds-accent))"
                strokeWidth={2}
                fill="url(#ga4UsersGradient)"
                dot={false}
                activeDot={{ fill: 'hsl(var(--ds-accent))', r: 5, strokeWidth: 2, stroke: 'hsl(var(--ds-surface))' }}
              />
            </AreaChart>
          </RechartsContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div style={cardWrap}>
          <span style={cardTitle}>
            <Globe size={13} strokeWidth={1.5} />
            Origem do tráfego
          </span>
          {(() => {
            const list = topEntries(ga4.dimensions?.sources_breakdown ?? null, 6);
            if (list.length === 0) {
              return <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>Sem dados ainda.</p>;
            }
            return (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: 0, padding: 0, listStyle: 'none' }}>
                {list.map((e) => (
                  <li key={e.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
                      <span
                        style={{
                          fontWeight: 500,
                          color: 'hsl(var(--ds-fg-2))',
                          textTransform: 'capitalize',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {e.key}
                      </span>
                      <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                        {e.value.toLocaleString('pt-BR')} · {e.pct.toFixed(1)}%
                      </span>
                    </div>
                    <ProgressBar pct={e.pct} color={accentWarning} />
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>

        <div style={cardWrap}>
          <span style={cardTitle}>
            <FileText size={13} strokeWidth={1.5} />
            Top páginas
          </span>
          {(() => {
            const pages = (ga4.dimensions?.top_pages ?? []).slice(0, 6);
            if (pages.length === 0) {
              return <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>Sem dados ainda.</p>;
            }
            return (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: 0, padding: 0, listStyle: 'none' }}>
                {pages.map((p, idx) => (
                  <li
                    key={`${p.path}-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      border: '1px solid hsl(var(--ds-line-2))',
                      padding: '8px 10px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: '"HN Text", monospace',
                        color: 'hsl(var(--ds-fg-2))',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={p.path}
                    >
                      {p.path}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'hsl(var(--ds-fg-1))',
                        fontVariantNumeric: 'tabular-nums',
                        flexShrink: 0,
                      }}
                    >
                      {Number(p.views ?? 0).toLocaleString('pt-BR')}
                    </span>
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>

        <div style={cardWrap}>
          <span style={cardTitle}>
            <Smartphone size={13} strokeWidth={1.5} />
            Dispositivos
          </span>
          {(() => {
            const list = topEntries(ga4.dimensions?.devices_breakdown ?? null, 6);
            if (list.length === 0) {
              return <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>Sem dados ainda.</p>;
            }
            const deviceLabels: Record<string, string> = {
              mobile: 'Mobile',
              desktop: 'Desktop',
              tablet: 'Tablet',
              smart_tv: 'Smart TV',
            };
            return (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: 0, padding: 0, listStyle: 'none' }}>
                {list.map((e) => {
                  const label = deviceLabels[e.key] ?? e.key;
                  return (
                    <li key={e.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
                        <span style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-2))' }}>{label}</span>
                        <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                          {e.value.toLocaleString('pt-BR')} · {e.pct.toFixed(1)}%
                        </span>
                      </div>
                      <ProgressBar pct={e.pct} color={accentWarning} />
                    </li>
                  );
                })}
              </ul>
            );
          })()}
        </div>
      </div>
    </>
  );
}
