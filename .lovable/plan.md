

# Arquitetura: financial_snapshots + financial_computed

## Situação Atual

A tabela `financial_snapshots` recebe dados brutos do Make (via PATCH direto no PostgREST). **Nenhum trigger modifica a própria tabela**, eliminando conflitos com PostgREST.

Uma tabela separada `financial_computed` armazena os valores calculados:
- `revenue_goal_monthly` (meta anual / 12)
- `contribution_margin_value` (revenue - costs_projects + refund_projects)
- `contribution_margin_pct` (margem / revenue * 100)
- `net_profit_value` (revenue - costs + refund)
- `net_profit_pct` (lucro / revenue * 100)
- `net_cash_flow` (realized_income - realized_expenses)
- `cumulative_cash_flow` (soma acumulada histórica)

## Fluxo

1. Make envia PATCH para `financial_snapshots` → dados brutos salvos sem conflito
2. Trigger AFTER INSERT/UPDATE em `financial_snapshots` → calcula e grava em `financial_computed` (tabela diferente, sem problema de self-referential update)
3. O mesmo trigger recalcula `cumulative_cash_flow` em `financial_computed` e sincroniza `current_balance` em `cash_flow_projections`

## Frontend

- `useFinancialData.ts` busca dados brutos de `financial_snapshots` + métricas de `financial_computed`
- `useCashFlowData.ts` busca `realized_income/expenses` de `financial_snapshots` + `net_cash_flow/cumulative_cash_flow` de `financial_computed`
