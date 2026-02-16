

## Destacar Valor em Reais ao Lado da Porcentagem

### Problema

A porcentagem agora esta em destaque, mas o valor em reais ficou pequeno e cinza demais, perdendo relevancia visual.

### Solucao

Colocar a porcentagem e o valor em reais na mesma linha, com a % grande e bold e o valor em reais medio ao lado, separados visualmente.

**Arquivo: `src/pages/Dashboard.tsx`**

**Card Margem de Contribuicao e Lucro Liquido - layout proposto:**

```
[icone] Margem de Contribuicao
31%  R$ 55.800,00
4.0pp abaixo da meta (35%)
```

A % fica em `text-3xl sm:text-4xl font-bold` e o valor em reais fica em `text-lg font-semibold text-foreground/70` na mesma linha, alinhados pelo baseline.

### Detalhes Tecnicos

Substituir o layout atual (div com % + p com valor) por um unico flex row com alinhamento baseline:

```tsx
<CardContent className="space-y-2">
  <div className="flex items-baseline gap-2 flex-wrap">
    <span className={cn(
      "text-3xl sm:text-4xl font-bold",
      marginAlert ? "text-warning" : "text-foreground"
    )}>
      {metrics.contribution_margin_actual}%
    </span>
    <span className="text-lg font-semibold text-foreground/70">
      {formatCurrency(metrics.contribution_margin_value)}
    </span>
  </div>
  {/* alerta continua igual */}
</CardContent>
```

Mesma estrutura para o card de Lucro Liquido.

### Arquivo editado

| Arquivo | Acao |
|---------|------|
| `src/pages/Dashboard.tsx` | Colocar % e valor em reais lado a lado nos cards Margem e Lucro |

