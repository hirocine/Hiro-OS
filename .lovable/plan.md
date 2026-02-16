

## Corrigir Overflow nos Cards "Meta Anual" e "Meta YTD"

### Problema

Os cards "Meta Anual" e "Meta YTD" estao dentro de uma coluna que ocupa 1/3 da largura da tela (grid `lg:grid-cols-3`). O breakpoint `sm:flex-row` ativa a partir de 640px de largura de **tela**, mas os cards continuam estreitos porque estao na coluna lateral. Isso faz "R$ 1.200.000,00" e "de R$ 2.000.000,00" ficarem na mesma linha, causando overflow.

### Solucao

Mudar o breakpoint de `sm:flex-row` para `lg:flex-row` apenas nos cards de Meta Anual e Meta YTD, que estao na coluna estreita. Assim, o valor e o texto "de" so ficam lado a lado quando a tela e grande o suficiente para que a coluna lateral tenha largura adequada.

**Arquivo: `src/pages/Dashboard.tsx`**

**Card Meta Anual (linha 266):**
```tsx
// De:
<div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">

// Para:
<div className="flex flex-col lg:flex-row lg:items-baseline lg:justify-between gap-0.5">
```

**Card Meta YTD (linha 283):**
```tsx
// De:
<div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">

// Para:
<div className="flex flex-col lg:flex-row lg:items-baseline lg:justify-between gap-0.5">
```

Nota: Os cards de "Mes Atual" (Faturamento, Margem, Lucro) nao precisam dessa mudanca porque ocupam mais largura no grid.

### Arquivo editado

| Arquivo | Acao |
|---------|------|
| `src/pages/Dashboard.tsx` | Mudar breakpoint de `sm` para `lg` nos cards Meta Anual e Meta YTD |

