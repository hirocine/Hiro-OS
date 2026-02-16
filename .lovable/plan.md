

## Fluxo de Caixa - Pagina Completa

### Resumo

Construir a pagina de Fluxo de Caixa com 5 cards principais mostrando a saude financeira de curto prazo da empresa. Usara dados mock (mesmo padrao do Dashboard) preparados para futura integracao com Supabase.

### Layout

A pagina tera um header com titulo "Fluxo de Caixa" e uma secao com 5 cards em grid responsivo:

```text
Desktop (3 colunas):
[Saldo Total Disponivel] [Fluxo Liquido do Mes] [Saldo Projetado (destaque)]
[Contas a Receber]       [Contas a Pagar]

Mobile (1 coluna): empilhados verticalmente
```

### Os 5 Cards

1. **Saldo Total Disponivel** - Soma de todas as contas bancarias. Icone: Wallet. Cor neutra.
2. **Fluxo Liquido do Mes** - (Recebido - Pago). Se negativo, alerta visual vermelho/warning. Icone: TrendingUp/TrendingDown conforme sinal.
3. **Contas a Receber (30 dias)** - Dinheiro previsto para entrar. Icone: ArrowDownLeft. Cor verde/success.
4. **Contas a Pagar (30 dias)** - Compromissos a honrar. Icone: ArrowUpRight. Cor laranja/warning.
5. **Saldo Projetado (Fim do Mes)** - (Saldo Atual + Receber - Pagar). Card com destaque visual (borda primary, fundo sutil). Icone: Target. Alerta se negativo.

### Detalhes Tecnicos

**Arquivos criados/editados:**

| Arquivo | Acao |
|---------|------|
| `src/data/mockCashFlowData.ts` | Criar dados mock e tipos para fluxo de caixa |
| `src/hooks/useCashFlowData.ts` | Criar hook com useQuery (mesmo padrao do useFinancialData) |
| `src/pages/CashFlow.tsx` | Substituir pagina em branco pelo layout completo |

**`src/data/mockCashFlowData.ts`:**

Tipos e dados mock:
```typescript
export interface CashFlowData {
  total_balance: number;          // Saldo total disponivel
  monthly_income: number;         // Total recebido no mes
  monthly_expenses: number;       // Total pago no mes
  net_flow: number;               // monthly_income - monthly_expenses
  receivables_30d: number;        // Contas a receber proximos 30 dias
  payables_30d: number;           // Contas a pagar proximos 30 dias
  projected_balance: number;      // total_balance + receivables - payables
}
```

**`src/hooks/useCashFlowData.ts`:**

Hook usando `useQuery` com dados mock e delay simulado (mesmo padrao de `useFinancialData`).

**`src/pages/CashFlow.tsx`:**

- Verificacao de `isAdmin` e `roleLoading` (mesmo padrao do Dashboard)
- Skeleton loading que espelha o layout dos 5 cards
- Grid responsivo: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Card "Saldo Projetado" com borda/fundo de destaque (primary)
- Fluxo Liquido com cor condicional (verde se positivo, vermelho se negativo)
- Formatacao em BRL usando `formatCurrency` existente
- Estilo dos cards seguindo o padrao `shadow-card hover:shadow-elegant` do Dashboard
