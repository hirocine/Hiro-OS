

## Reestruturar o Dashboard em 3 Secoes

### Nova Estrutura

```text
+-------------------------------------------------------+
| Secao 1: "Mes Atual (Fev)"                            |
| [Faturamento vs Meta] [Margem Contrib R$] [Lucro Liq] |
+-------------------------------------------------------+
| Secao 2: "Faturamento (2026)"                          |
| [Meta Anual ]  [                                  ]    |
| [Meta YTD   ]  [   Grafico Meta vs Realizado      ]    |
+-------------------------------------------------------+
| Secao 3: "Indicadores"                                 |
| [% Margem] [% Lucro] [Ticket] [LTV] [CAC] [LTV/CAC]  |
| [Churn] [NPS] [Burn Rate] [Cash Runway]                |
+-------------------------------------------------------+
```

### Mudancas no mock data (`src/data/mockFinancialData.ts`)

Adicionar novos campos a `FinancialMetrics`:
- `contribution_margin_value: number` -- Margem de contribuicao em R$ (ex: 55_800)
- `net_profit_value: number` -- Lucro liquido em R$ (ex: 30_600)

Esses valores representam o valor absoluto no mes, enquanto os campos `_actual` existentes representam a %.

### Mudancas no Dashboard (`src/pages/Dashboard.tsx`)

**Secao 1 -- "Mes Atual (Fev)"**

- Titulo dinamico: pega o mes atual abreviado (ex: `new Date().toLocaleString('pt-BR', { month: 'short' })` -> "fev") e exibe "Mes Atual (Fev)"
- Icone: `Calendar` do lucide-react
- 3 cards lado a lado (`grid grid-cols-1 md:grid-cols-3`):
  1. **Faturamento do Mes** -- Mantem o card atual com faturamento vs meta, progress bar e badge "Meta batida!"
  2. **Margem de Contribuicao** -- Valor em R$ (ex: R$ 55.800,00) com a % entre parenteses representando quanto isso e do faturamento (ex: "31% do faturamento")
  3. **Lucro Liquido** -- Valor em R$ (ex: R$ 30.600,00) com a % (ex: "17% do faturamento"). Subtitulo mostra "Faturamento - custos de projeto - custos fixos"

**Secao 2 -- "Faturamento (2026)"**

- Titulo: "Faturamento (2026)" com icone BarChart3
- Layout: grid `lg:grid-cols-3`
  - Coluna esquerda (`lg:col-span-1`): 2 cards empilhados
    - Meta Anual (card existente)
    - Meta YTD (card existente)
  - Coluna direita (`lg:col-span-2`): Grafico ComposedChart (card existente, move de col-span-2 para a direita)

**Secao 3 -- "Indicadores"**

- Mantem titulo e icone atuais
- Adiciona 2 novos UnitCards no inicio do grid:
  1. **% Margem de Contribuicao** -- valor `31%`, meta `35%`, alerta se abaixo
  2. **% Lucro Liquido** -- valor `17%`, meta `20%`, alerta se abaixo
- Seguidos pelos 8 cards existentes (Ticket Medio, LTV, CAC, LTV/CAC, Churn, NPS, Burn Rate, Cash Runway)
- Grid passa para `lg:grid-cols-5` na primeira linha (5 cards) e continua na segunda

### Arquivos editados

| Arquivo | Acao |
|---------|------|
| `src/data/mockFinancialData.ts` | Adicionar `contribution_margin_value` e `net_profit_value` |
| `src/hooks/useFinancialData.ts` | Nenhuma mudanca (tipos vem do mock) |
| `src/pages/Dashboard.tsx` | Reestruturar as 3 secoes conforme descrito |

Nenhuma dependencia nova. Apenas adiciona import de `Calendar` do lucide-react.

