

## Adicionar Secao "Fluxo de Caixa" ao Dashboard

### Resumo

Inserir uma nova secao "Fluxo de Caixa" no Dashboard, entre "Mes Atual" e "Faturamento (2026)", reutilizando os mesmos 5 cards da pagina `/financeiro/fluxo-de-caixa`.

### Layout

```text
Secao 1: Mes Atual (Fev)        <-- ja existe
Secao 2: Fluxo de Caixa         <-- NOVA
Secao 3: Faturamento (2026)     <-- ja existe
Secao 4: Indicadores            <-- ja existe
```

A nova secao tera o mesmo grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` com os 5 cards: Saldo Total, Fluxo Liquido, Saldo Projetado (destaque), Contas a Receber e Contas a Pagar. Visual identico a pagina dedicada.

### Detalhes Tecnicos

**Arquivo editado:** `src/pages/Dashboard.tsx`

Mudancas:
1. Importar `useCashFlowData` e icones adicionais (`Wallet`, `ArrowDownLeft`, `ArrowUpRight`)
2. Chamar `useCashFlowData()` junto aos outros hooks no topo do componente
3. Adicionar a secao entre as linhas 243 (fim do "Mes Atual") e 245 (inicio do "Faturamento"), com header "Fluxo de Caixa" (icone Wallet) e os 5 `CashFlowCard`-style cards inline (reutilizando o mesmo padrao visual de Card/CardHeader/CardContent ja usado no Dashboard)
4. Incluir o loading do cash flow no skeleton (adicionar mais um bloco de 5 skeletons no estado de carregamento)

