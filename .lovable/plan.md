

## Dashboard Financeiro Executivo

Substituir o dashboard atual de inventario por um dashboard financeiro executivo completo, com mock data preparado para futura integracao com Supabase.

### Arquivos a criar

**1. `src/data/mockFinancialData.ts`** — Dados ficticios estruturados

```
financial_goals: revenue_goal (2M), margin_goal_pct (35%), profit_goal_pct (20%), cac_goal (500)
financial_metrics: total_revenue (180k/mes), accumulated_revenue_ytd (1.2M), avg_ticket (15k), cac (420), ltv (45k), churn_rate (3.2%), burn_rate (95k), contribution_margin_actual (31%), net_profit_actual (17%), nps (72)
monthly_data: 12 meses com meta vs realizado para grafico de barras
```

**2. `src/hooks/useFinancialData.ts`** — Hook preparado para Supabase

Retorna mock data agora, mas com a estrutura de `useQuery` pronta para trocar por chamadas reais ao Supabase (`financial_metrics` table).

**3. `src/pages/Dashboard.tsx`** — Reescrever completamente

### Estrutura da nova pagina

```
ResponsiveContainer
  PageHeader ("Dashboard Financeiro", subtitle com timestamp)

  Secao 1: Header de Performance
    - Card: Meta Anual (R$ 2M) vs Realizado (R$ 1.2M) com Progress bar (60%)
    - Card: Meta YTD vs Realizado YTD
    - Card: Faturamento do Mes vs Meta (com badge de celebracao se > 100%)

  Secao 2: Graficos
    - Grafico de Barras Duplas (Recharts): Meta vs Realizado por mes
    - Indicadores laterais: Margem de Contribuicao e Lucro Liquido
      (com cor de alerta se margem < meta)

  Secao 3: Grid de Saude (Unit Economics)
    - Grid 3-4 colunas com cards individuais:
      LTV | CAC | LTV/CAC Ratio | Churn Rate | Ticket Medio | Burn Rate | NPS
```

### Logica de UI

- `contribution_margin_actual (31%) < margin_goal_pct (35%)` => texto em `text-warning` ou `text-destructive`
- Atingimento mensal > 100% => badge verde "Meta batida!" com icone de celebracao
- Progress bars usando o componente `Progress` existente
- Cards seguindo o padrao visual do dashboard atual (bg-gradient-card, shadow-elegant, hover:scale)

### Roteamento

Nenhuma mudanca necessaria em `App.tsx` — a rota `/dashboard` ja aponta para `Dashboard.tsx`.

### Sidebar

Renomear o label na sidebar de "Dashboard" para "Dashboard Financeiro" nos arquivos:
- `src/components/Layout/DesktopSidebar.tsx`
- `src/components/Layout/MobileSidebar.tsx`
- `src/components/Layout/Sidebar.tsx`

### Detalhes tecnicos

| Item | Detalhe |
|------|---------|
| Graficos | Recharts (ja instalado) — BarChart com duas series |
| Formatacao | `formatCurrency` de `@/lib/utils` para valores em BRL |
| Skeleton | Skeleton de loading seguindo o padrao atual com `StatsCardSkeleton` |
| Protecao | Manter `isAdmin` guard existente |
| Componentes | Reutilizar Card, Progress, PageHeader, ResponsiveContainer |

### Arquivos editados

| Arquivo | Acao |
|---------|------|
| `src/data/mockFinancialData.ts` | Criar (mock data) |
| `src/hooks/useFinancialData.ts` | Criar (hook) |
| `src/pages/Dashboard.tsx` | Reescrever (nova pagina) |
| `src/components/Layout/DesktopSidebar.tsx` | Renomear label |
| `src/components/Layout/MobileSidebar.tsx` | Renomear label |
| `src/components/Layout/Sidebar.tsx` | Renomear label |

Nenhuma dependencia nova. 6 arquivos, 3 novos e 3 editados.

