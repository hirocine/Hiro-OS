

## Reimaginar o Grafico de Faturamento Mensal com ComposedChart

### O que muda

Substituir o `BarChart` atual por um `ComposedChart` da Recharts que combina barras (Meta) com linha (Realizado), criando um visual mais moderno e limpo.

### Mudancas tecnicas

**Arquivo: `src/pages/Dashboard.tsx`**

**1. Imports (linha 16-18)**

Substituir os imports do Recharts:

```tsx
// De:
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer as RechartsContainer, Legend } from 'recharts';

// Para:
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer as RechartsContainer } from 'recharts';
```

Remove `BarChart`, `Legend`. Adiciona `ComposedChart`, `Line`.

**2. Grafico (linhas 188-211)**

Substituir o bloco do grafico por:

```tsx
<RechartsContainer width="100%" height="100%">
  <ComposedChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
    <YAxis
      orientation="right"
      tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
      axisLine={false}
      tickLine={false}
    />
    <Tooltip content={<CustomTooltip />} />
    <Bar dataKey="meta" name="Meta" fill="rgba(255,255,255,0.1)" radius={[4,4,0,0]} barSize={32} />
    <Line
      type="monotone"
      dataKey="realizado"
      name="Realizado"
      stroke="hsl(var(--primary))"
      strokeWidth={3}
      dot={{ fill: 'hsl(var(--primary))', r: 5, strokeWidth: 0 }}
      activeDot={{ fill: 'hsl(var(--primary))', r: 7, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
    />
  </ComposedChart>
</RechartsContainer>
```

Destaques:
- `vertical={false}` remove linhas de grade verticais
- Sem `<Legend />`
- Eixo Y movido para a direita com `orientation="right"`, sem linhas de eixo
- Barras de meta com opacidade baixa como pano de fundo
- Linha de realizado com `strokeWidth={3}`, curva suave, marcadores circulares solidos

**3. Tooltip Personalizado (novo componente interno)**

Adicionar antes do `export default function Dashboard()`:

```tsx
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const meta = payload.find((p: any) => p.dataKey === 'meta')?.value ?? 0;
  const realizado = payload.find((p: any) => p.dataKey === 'realizado')?.value ?? 0;
  const diff = meta > 0 ? (((realizado - meta) / meta) * 100).toFixed(1) : '0.0';
  const isPositive = Number(diff) >= 0;

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-sm bg-white/10 inline-block" />
            Meta
          </span>
          <span className="font-medium text-muted-foreground">{formatCurrency(meta)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-primary">
            <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
            Realizado
          </span>
          <span className="font-medium text-foreground">{formatCurrency(realizado)}</span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-border">
        <span className={isPositive ? 'text-success' : 'text-warning'}>
          {isPositive ? '+' : ''}{diff}%
        </span>
        <span className="text-muted-foreground text-xs ml-1">vs meta</span>
      </div>
    </div>
  );
}
```

### Resultado visual

- Barras cinza escuro transparentes como pano de fundo indicando a meta
- Linha verde protagonista com marcadores circulares solidos
- Sem legenda (autoexplicativo)
- Eixo Y a direita com formato "100k", "200k"
- Sem linhas de grade verticais
- Tooltip moderno com mes, meta, realizado e diferenca percentual

### Arquivos editados

| Arquivo | Acao |
|---------|------|
| `src/pages/Dashboard.tsx` | Substituir imports, grafico e adicionar CustomTooltip |

Nenhuma dependencia nova.
