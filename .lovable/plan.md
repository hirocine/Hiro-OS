

# Automação: net_profit_value e net_profit_pct

## Situação Atual

Já existem triggers automáticos para `contribution_margin_value` e `contribution_margin_pct`. O pedido é criar a mesma lógica para:

- **`net_profit_value`** = `revenue - costs`
- **`net_profit_pct`** = `(net_profit_value / revenue) * 100`

## Alteração

Uma única migration SQL que cria (ou substitui) duas funções trigger + seus triggers na tabela `financial_snapshots`:

1. **`auto_fill_net_profit_value()`** — calcula `NEW.net_profit_value := COALESCE(NEW.revenue, 0) - COALESCE(NEW.costs, 0)` antes de INSERT/UPDATE
2. **`auto_fill_net_profit_pct()`** — calcula `NEW.net_profit_pct := ROUND((net_profit_value / revenue) * 100, 2)` com proteção contra divisão por zero, executado APÓS o trigger de value

A migration também faz um UPDATE em massa para recalcular os valores existentes.

| Recurso | Alteração |
|---|---|
| Migration SQL | Criar 2 funções + 2 triggers + bulk update |

Nenhum arquivo de código precisa mudar — o hook `useFinancialData.ts` já lê esses campos do banco.

