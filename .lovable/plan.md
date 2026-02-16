

## Padronizar Cards de Margem e Lucro com o Card de Faturamento

### Problema

Os cards "Margem de Contribuicao" e "Lucro Liquido" usam `text-3xl sm:text-4xl` para a porcentagem, que e muito maior que o `text-xl sm:text-2xl` usado no card "Faturamento do Mes". Isso quebra a consistencia visual da secao.

### Solucao

Alinhar a tipografia dos cards de Margem e Lucro com o padrao do card de Faturamento:

- Porcentagem: de `text-3xl sm:text-4xl` para `text-xl sm:text-2xl font-bold` (mesmo tamanho do valor de faturamento)
- Valor em reais: manter ao lado, mas ajustar para `text-sm font-medium text-muted-foreground` (similar ao "meta R$..." do card de faturamento)
- Adicionar uma `Progress` bar mostrando a % vs meta, igual ao card de Faturamento
- Adicionar texto auxiliar com a meta, no mesmo estilo dos outros cards

Layout final para cada card:

```
[icone] Margem de Contribuicao
31%  R$ 55.800,00
[===progress bar===]           <- novo
Meta: 35%                      <- novo
4.0pp abaixo da meta (35%)     <- alerta condicional
```

### Detalhes Tecnicos

**Arquivo: `src/pages/Dashboard.tsx`**

**Card Margem de Contribuicao (linhas 194-212):**

```tsx
<CardContent className="space-y-3">
  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
    <span className={cn(
      "text-xl sm:text-2xl font-bold",
      marginAlert ? "text-warning" : "text-foreground"
    )}>
      {metrics.contribution_margin_actual}%
    </span>
    <span className="text-xs text-muted-foreground">
      {formatCurrency(metrics.contribution_margin_value)}
    </span>
  </div>
  <Progress value={Math.min(Math.round((metrics.contribution_margin_actual / goals.margin_goal_pct) * 100), 100)} className="h-2" />
  <p className="text-xs text-muted-foreground">
    {Math.round((metrics.contribution_margin_actual / goals.margin_goal_pct) * 100)}% da meta ({goals.margin_goal_pct}%)
  </p>
</CardContent>
```

**Card Lucro Liquido (linhas 226-244):** Mesma estrutura usando `net_profit_actual`, `net_profit_value` e `profit_goal_pct`.

Isso mantem os 3 cards da secao "Mes Atual" com exatamente o mesmo padrao visual: valor principal + texto secundario + barra de progresso + texto de meta.

### Arquivo editado

| Arquivo | Acao |
|---------|------|
| `src/pages/Dashboard.tsx` | Padronizar layout dos cards Margem e Lucro com o mesmo formato do card Faturamento (valor + progress bar + meta) |

