import { Users, BarChart3 } from 'lucide-react';
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
import { fmtChartDate } from '@/lib/marketing-dashboard-utils';

interface Props {
  followersSeries: { date: string; followers: number }[];
  reachSeries: { date: string; reach: number }[];
  periodLabel: string;
}

const cardWrap: React.CSSProperties = {
  border: '1px solid hsl(var(--ds-line-1))',
  background: 'hsl(var(--ds-surface))',
  padding: '14px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const cardHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
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

export function AccountChartsSection({
  followersSeries,
  reachSeries,
  periodLabel,
}: Props) {
  return (
    <>
      <div style={cardWrap}>
        <div style={cardHeader}>
          <span style={cardTitle}>
            <Users size={13} strokeWidth={1.5} />
            Evolução de seguidores
          </span>
          <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))', fontVariantNumeric: 'tabular-nums' }}>
            {periodLabel}
          </span>
        </div>
        <div style={{ height: 240 }}>
          {followersSeries.length < 2 ? (
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
              <Users size={28} strokeWidth={1.25} style={{ color: 'hsl(var(--ds-fg-4))' }} />
              <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                Coletando histórico de seguidores
              </p>
              <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', maxWidth: 360, lineHeight: 1.4 }}>
                A API do Instagram não fornece histórico de seguidores. O gráfico ganha forma à medida
                que cada dia é capturado pelo sistema.
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: 'hsl(var(--ds-fg-4))',
                  fontVariantNumeric: 'tabular-nums',
                  marginTop: 4,
                }}
              >
                {followersSeries.length}/7 dias coletados
              </p>
            </div>
          ) : (
            <RechartsContainer width="100%" height="100%">
              <AreaChart data={followersSeries} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="followersGradient" x1="0" y1="0" x2="0" y2="1">
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
                  domain={['dataMin - 10', 'dataMax + 10']}
                />
                <RTooltip content={<ChartTooltip unit="seguidores" />} />
                <Area
                  type="monotone"
                  dataKey="followers"
                  stroke="hsl(var(--ds-accent))"
                  strokeWidth={2}
                  fill="url(#followersGradient)"
                  dot={{ fill: 'hsl(var(--ds-accent))', r: 3, strokeWidth: 0 }}
                  activeDot={{ fill: 'hsl(var(--ds-accent))', r: 5, strokeWidth: 2, stroke: 'hsl(var(--ds-surface))' }}
                />
              </AreaChart>
            </RechartsContainer>
          )}
        </div>
      </div>

      <div style={cardWrap}>
        <div style={cardHeader}>
          <span style={cardTitle}>
            <BarChart3 size={13} strokeWidth={1.5} />
            Alcance diário
          </span>
        </div>
        <div style={{ height: 220 }}>
          {reachSeries.length === 0 ? (
            <div
              style={{
                height: '100%',
                display: 'grid',
                placeItems: 'center',
                color: 'hsl(var(--ds-fg-3))',
                fontSize: 12,
              }}
            >
              Sem dados no período.
            </div>
          ) : (
            <RechartsContainer width="100%" height="100%">
              <AreaChart data={reachSeries} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="reachGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--ds-warning))" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(var(--ds-warning))" stopOpacity={0} />
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
                <RTooltip content={<ChartTooltip unit="alcance" />} />
                <Area
                  type="monotone"
                  dataKey="reach"
                  stroke="hsl(var(--ds-warning))"
                  strokeWidth={2}
                  fill="url(#reachGradient)"
                  dot={false}
                  activeDot={{ fill: 'hsl(var(--ds-warning))', r: 4, strokeWidth: 2, stroke: 'hsl(var(--ds-surface))' }}
                />
              </AreaChart>
            </RechartsContainer>
          )}
        </div>
      </div>
    </>
  );
}
