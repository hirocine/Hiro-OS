

## Corrigir Tamanho de Fonte nos Cards "Meta Anual" e "Meta YTD"

### Problema

Os cards "Meta Anual" e "Meta YTD" ocupam 1/3 da largura da tela (coluna lateral do grid `lg:grid-cols-3`). O breakpoint `sm:text-2xl` ativa a partir de 640px de largura de **tela**, mas os cards continuam estreitos. Resultado: "R$ 1.200.000,00" com `text-2xl` (1.5rem) transborda o card.

O `flex-col` ja funciona (valor e "de" estao empilhados), mas o valor em si e grande demais para a largura disponivel.

### Solucao

Reduzir o tamanho da fonte dos valores financeiros **apenas** nos cards Meta Anual e Meta YTD, que ficam na coluna estreita.

**Arquivo: `src/pages/Dashboard.tsx`**

**Card Meta Anual (linha 267) e Meta YTD (linha 284):**

```tsx
// De:
<span className="text-xl sm:text-2xl font-bold text-foreground">

// Para:
<span className="text-lg lg:text-xl font-bold text-foreground">
```

Isso usa `text-lg` (1.125rem) como padrao e so sobe para `text-xl` (1.25rem) no breakpoint `lg` (1024px+), quando a coluna lateral tem largura suficiente.

### Arquivo editado

| Arquivo | Acao |
|---------|------|
| `src/pages/Dashboard.tsx` | Reduzir fonte dos valores nos cards Meta Anual e Meta YTD de `text-xl sm:text-2xl` para `text-lg lg:text-xl` |

