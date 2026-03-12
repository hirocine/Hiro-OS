

# Corrigir escopo temporal: Faturamento até o mês atual

## Problema

Os cards "Meta Anual", "Meta YTD" e o gráfico "Meta vs Realizado" consideram dados e metas dos 12 meses do ano. O correto é limitar tudo até o mês corrente (março = meses 1-3).

Impactos concretos:
- **`accumulated_revenue_ytd`** no hook soma todos os snapshots do ano (inclusive meses futuros se existirem) — deve filtrar apenas `month <= currentMonth`
- **Card "Meta Anual"**: compara YTD contra meta do ano inteiro (ex: 60% parece baixo em março) — deve comparar contra meta proporcional até o mês atual
- **Gráfico**: barras de Meta aparecem para os 12 meses — meses futuros não devem ter barra de meta

## Alterações

### 1. `src/hooks/useFinancialData.ts`
- Filtrar `accumulated_revenue_ytd` para somar apenas snapshots com `month <= currentMonth`
- No `monthlyData`, zerar a meta (`meta: 0`) para meses futuros (`i + 1 > currentMonth`)

### 2. `src/pages/Dashboard.tsx`
- **Card "Meta Anual"**: trocar o denominador de `goals.revenue_goal` (anual) para `ytdGoal` (proporcional), tornando o progresso relativo ao período decorrido
- Ajustar o texto descritivo para indicar que é a meta proporcional ao período (ex: "de R$ 500.000 (até março)")
- `annualProgress` passa a usar `ytdGoal` como denominador

| Arquivo | O que muda |
|---|---|
| `useFinancialData.ts` | Filtrar YTD por `month <= currentMonth`; zerar meta de meses futuros no chart |
| `Dashboard.tsx` | Card "Meta Anual" usa `ytdGoal` como referência; ajustar labels |

