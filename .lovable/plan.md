

## Reestruturar Secao "Fluxo de Caixa" no Dashboard e Pagina Dedicada

### Resumo

Reorganizar os cards de Fluxo de Caixa em 3 linhas semanticas, adicionar 2 novos cards (Receitas Realizado e Despesas Realizado), dar destaque visual ao Saldo Atual, e aplicar cores consistentes de BI (verde = entrada, vermelho = saida, azul/primary = projecao).

### Novo Layout

```text
Linha 1 (full-width, destaque):
  [Saldo Atual Disponivel] -- card maior, borda primary, fundo sutil, icone grande

Linha 2 (3 colunas - Realizado do mes):
  [Receitas Realizado]  [Despesas Realizado]  [Fluxo Liquido]
  verde                 vermelho/destructive   verde ou vermelho conforme sinal

Linha 3 (3 colunas - Projecao/Nao Realizado):
  [Contas a Receber]    [Contas a Pagar]      [Saldo Projetado Fim do Mes]
  verde                 vermelho/destructive   primary (ou vermelho se negativo)
```

### Paleta de Cores (logica BI)

| Tipo | Cor | Uso |
|------|-----|-----|
| Entrada de dinheiro | `text-success` (verde) | Receitas, Contas a Receber, Fluxo Liquido positivo |
| Saida de dinheiro | `text-destructive` (vermelho) | Despesas, Contas a Pagar, Fluxo Liquido negativo |
| Projecao/Destaque | `text-primary` (azul) | Saldo Atual, Saldo Projetado (positivo) |
| Alerta | `text-destructive` | Saldo Projetado negativo |

### Detalhes Tecnicos

**Arquivos editados:**

| Arquivo | Acao |
|---------|------|
| `src/data/mockCashFlowData.ts` | Adicionar campos `realized_income` e `realized_expenses` ao tipo e mock |
| `src/pages/Dashboard.tsx` | Reestruturar secao Fluxo de Caixa com 3 linhas e novos cards |
| `src/pages/CashFlow.tsx` | Aplicar mesmo layout de 3 linhas na pagina dedicada |

**Mudancas no modelo de dados (`mockCashFlowData.ts`):**

Adicionar dois novos campos ao `CashFlowData`:
- `realized_income: number` -- Receitas ja realizadas no mes (dinheiro que ja entrou)
- `realized_expenses: number` -- Despesas ja realizadas no mes (dinheiro que ja saiu)

Valores mock: `realized_income: 142_000`, `realized_expenses: 108_000`. O `net_flow` passara a ser calculado a partir destes (142k - 108k = 34k).

**Mudancas no Dashboard (`Dashboard.tsx`):**

Secao Fluxo de Caixa reestruturada:

1. **Linha 1**: Card "Saldo Atual Disponivel" em full-width (`col-span-full`), com borda `border-primary/40`, fundo `bg-primary/5`, valor em `text-primary text-3xl`, icone Wallet maior. Subtitulo: "Soma de todas as contas bancarias".

2. **Linha 2**: Grid de 3 colunas com:
   - "Receitas Realizado" -- valor verde, icone ArrowDownLeft verde
   - "Despesas Realizado" -- valor vermelho/destructive, icone ArrowUpRight vermelho
   - "Fluxo Liquido Atual" -- valor verde ou vermelho conforme sinal, subtitulo mostrando a diferenca

3. **Linha 3**: Grid de 3 colunas com:
   - "Contas a Receber (Nao Realizado)" -- valor verde, subtitulo "Previsto para entrar"
   - "Contas a Pagar (Nao Realizado)" -- valor vermelho/destructive, subtitulo "Compromissos pendentes"
   - "Saldo Projetado (Fim do Mes)" -- card com destaque primary (ou destructive se negativo), subtitulo com formula

**Mudancas na pagina dedicada (`CashFlow.tsx`):**

Mesmo layout de 3 linhas, espelhando o Dashboard para consistencia.

