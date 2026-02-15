

## Corrigir animacao de deslocamento ao expandir subitens

### Problema

Quando o grupo expande, a classe `p-1` e adicionada ao container, empurrando todos os itens (incluindo o pai) 4px para a direita e para baixo. Isso causa um "pulo" visual desagradavel.

### Solucao

Manter o `p-1` sempre presente no container (expandido ou nao), para que o item pai nunca se desloque. Apenas o fundo (`bg-muted/50` e `rounded-lg`) aparece/desaparece com transicao suave.

### Alteracoes

**`src/components/Layout/DesktopSidebar.tsx`** -- componente `NavItemWithChildren`, linha 106-109:

Trocar:
```tsx
<div className={cn(
  "transition-colors duration-200",
  expanded && "rounded-lg bg-muted/50 p-1"
)}>
```

Por:
```tsx
<div className={cn(
  "transition-colors duration-200 p-1 rounded-lg",
  expanded ? "bg-muted/50" : "bg-transparent"
)}>
```

O `p-1` e `rounded-lg` ficam sempre aplicados, entao o item pai nunca muda de posicao. Apenas o `bg-muted/50` aparece quando expandido (com a transicao de cor ja existente).

**`src/components/Layout/MobileSidebar.tsx`** -- mesma alteracao no componente equivalente.

### Resultado

O item "Tarefas" permanece fixo na mesma posicao. Ao expandir, apenas o fundo sutil aparece atras dele e dos subitens, sem nenhum deslocamento.

