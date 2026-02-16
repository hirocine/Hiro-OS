
## Dar Mais Destaque as Porcentagens nos Cards de Margem e Lucro

### Problema

Os cards "Margem de Contribuicao" e "Lucro Liquido" mostram o valor monetario grande e a porcentagem como texto secundario pequeno ("31% do faturamento"). Isso deixa os cards com sensacao de vazios e a informacao mais importante (a %) perde destaque.

### Solucao

Reformular o layout desses dois cards para destacar a porcentagem como metrica principal, ao lado do valor monetario:

**Arquivo: `src/pages/Dashboard.tsx`**

**Card Margem de Contribuicao (linhas 194-212) e Lucro Liquido (linhas 226-244):**

Layout atual:
```
R$ 55.800,00        (grande, bold)
31% do faturamento   (pequeno, cinza)
4.0pp abaixo...      (pequeno, warning)
```

Layout proposto:
```
31%                  (muito grande, bold, cor de destaque)
R$ 55.800,00         (medio, secundario)
4.0pp abaixo...      (pequeno, warning)
```

Mudancas especificas:

1. **Porcentagem como valor principal**: Exibir `{metrics.contribution_margin_actual}%` em `text-3xl sm:text-4xl font-bold` com cor condicional (warning se abaixo da meta, success/foreground se ok)

2. **Valor monetario como secundario**: Mover `formatCurrency(metrics.contribution_margin_value)` para uma linha abaixo em `text-sm text-muted-foreground`

3. **Remover texto redundante**: Eliminar "do faturamento" pois o titulo do card ja deixa claro o contexto

4. **Manter alerta**: O texto de "Xpp abaixo da meta" continua igual

Resultado visual para Margem de Contribuicao:
```
[icone] Margem de Contribuicao
31%
R$ 55.800,00
4.0pp abaixo da meta (35%)
```

Resultado visual para Lucro Liquido:
```
[icone] Lucro Liquido
17%
R$ 30.600,00
3.0pp abaixo da meta (20%)
```

### Detalhes Tecnicos

**Margem de Contribuicao (linhas 194-212):**
```tsx
<CardContent className="space-y-2">
  <div className="text-3xl sm:text-4xl font-bold" style com cor condicional>
    {metrics.contribution_margin_actual}%
  </div>
  <p className="text-sm text-muted-foreground">
    {formatCurrency(metrics.contribution_margin_value)}
  </p>
  {marginAlert && (
    <p className="text-xs text-warning ...">...</p>
  )}
</CardContent>
```

**Lucro Liquido (linhas 226-244):** Mesma estrutura, usando `net_profit_actual` e `net_profit_value`.

### Arquivo editado

| Arquivo | Acao |
|---------|------|
| `src/pages/Dashboard.tsx` | Reformular cards de Margem e Lucro para destacar porcentagem como metrica principal |
