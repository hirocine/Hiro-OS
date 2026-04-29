import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BarChart3 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
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

export function AccountChartsSection({
  followersSeries,
  reachSeries,
  periodLabel,
}: Props) {
  return (
    <>
      {/* Followers evolution chart */}
      <Card className="shadow-card hover:shadow-elegant transition-all duration-200">
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Evolução de seguidores
          </CardTitle>
          <span className="text-xs text-muted-foreground font-numeric">
            {periodLabel}
          </span>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {followersSeries.length < 2 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6 gap-2">
                <Users className="h-8 w-8 text-muted-foreground/60" />
                <p className="text-sm font-medium text-foreground">
                  Coletando histórico de seguidores
                </p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  A API do Instagram não fornece histórico de seguidores. O gráfico
                  ganha forma à medida que cada dia é capturado pelo sistema.
                </p>
                <p className="text-xs text-muted-foreground font-numeric mt-1">
                  {followersSeries.length}/7 dias coletados
                </p>
              </div>
            ) : (
              <RechartsContainer width="100%" height="100%">
                <AreaChart data={followersSeries} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="followersGradient" x1="0" y1="0" x2="0" y2="1">
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
                    domain={['dataMin - 10', 'dataMax + 10']}
                  />
                  <RTooltip content={<ChartTooltip unit="seguidores" />} />
                  <Area
                    type="monotone"
                    dataKey="followers"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fill="url(#followersGradient)"
                    dot={{ fill: 'hsl(var(--primary))', r: 3, strokeWidth: 0 }}
                    activeDot={{ fill: 'hsl(var(--primary))', r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                  />
                </AreaChart>
              </RechartsContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daily reach */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-card hover:shadow-elegant transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Alcance diário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {reachSeries.length === 0 ? (
                <EmptyState compact icon={BarChart3} title="" description="Sem dados no período." />
              ) : (
                <RechartsContainer width="100%" height="100%">
                  <AreaChart data={reachSeries} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="reachGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={fmtChartDate}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v: number) => v.toLocaleString('pt-BR')}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontFamily: 'Inter, system-ui, sans-serif', style: { fontVariantNumeric: 'tabular-nums' } } as any}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RTooltip content={<ChartTooltip unit="alcance" />} />
                    <Area
                      type="monotone"
                      dataKey="reach"
                      stroke="hsl(var(--warning))"
                      strokeWidth={2.5}
                      fill="url(#reachGradient)"
                      dot={false}
                      activeDot={{ fill: 'hsl(var(--warning))', r: 4, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                    />
                  </AreaChart>
                </RechartsContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
