import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CapexChartData {
  month: string;
  invested: number;
  currentValue: number;
}

const mockCapexEvolution: CapexChartData[] = [
  { month: 'Out', invested: 120000, currentValue: 115000 },
  { month: 'Nov', invested: 128000, currentValue: 121500 },
  { month: 'Dez', invested: 135000, currentValue: 126800 },
  { month: 'Jan', invested: 140000, currentValue: 130200 },
  { month: 'Fev', invested: 142000, currentValue: 128500 },
  { month: 'Mar', invested: 144000, currentValue: 126000 },
];

export function RentalCapexChart() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Patrimônio / CAPEX</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockCapexEvolution}>
              <defs>
                <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="currentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
                formatter={(value: number, name: string) => [
                  `R$ ${value.toLocaleString('pt-BR')}`,
                  name === 'invested' ? 'Total Investido' : 'Valor Atual',
                ]}
              />
              <Area
                type="monotone"
                dataKey="invested"
                stroke="hsl(var(--primary))"
                fill="url(#investedGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="currentValue"
                stroke="hsl(var(--success))"
                fill="url(#currentGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
            Total Investido
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-success" />
            Valor Atual (após depreciação)
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
