

## Adicionar Card "Cash Runway" e Reordenar Grid de Saude do Negocio

### Mudancas

**1. `src/data/mockFinancialData.ts`**

Adicionar campo `cash_runway_months` na interface `FinancialMetrics` e no mock data. Cash Runway sera calculado como meses de operacao restantes (ex: 18 meses como valor ficticio).

```
cash_runway_months: number  // adicionado a FinancialMetrics
```

Mock value: `18` (meses)

**2. `src/pages/Dashboard.tsx`**

- Importar icone `Hourglass` do lucide-react para o card de Cash Runway
- Reordenar os UnitCards na secao "Saude do Negocio" para a seguinte ordem:

```
Linha 1: Ticket Medio | LTV       | CAC      | LTV/CAC
Linha 2: Churn Rate   | NPS       | Burn Rate | Cash Runway
```

- Adicionar o novo UnitCard de Cash Runway:

```tsx
<UnitCard
  title="Cash Runway"
  value={`${metrics.cash_runway_months} meses`}
  icon={Hourglass}
  subtitle={metrics.cash_runway_months <= 6 ? 'Atencao: runway curto' : 'Saude financeira'}
  alert={metrics.cash_runway_months <= 6}
  highlight={metrics.cash_runway_months >= 18}
/>
```

Logica de alerta: <= 6 meses mostra alerta; >= 18 meses mostra destaque verde.

### Arquivos editados

| Arquivo | Acao |
|---------|------|
| `src/data/mockFinancialData.ts` | Adicionar `cash_runway_months` na interface e mock |
| `src/pages/Dashboard.tsx` | Reordenar cards + adicionar Cash Runway |

Nenhuma dependencia nova.

