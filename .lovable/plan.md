

## Remover negrito do item pai "Tarefas" quando expandido

### Problema

O item pai "Tarefas" fica em negrito (`font-semibold`) quando expandido, mas o usuario quer que apenas o subitem selecionado tenha destaque visual. O pai deve ter peso normal.

### Solucao

Trocar `font-semibold` por `font-normal` (ou remover a declaracao) no estado expandido do item pai.

### Alteracoes

**`src/components/Layout/DesktopSidebar.tsx`** (linha 119):

```tsx
// De:
expanded ? "text-foreground font-semibold"
// Para:
expanded ? "text-muted-foreground"
```

**`src/components/Layout/MobileSidebar.tsx`** (linha 86):

Mesma alteracao.

### Resultado

O pai "Tarefas" fica com texto normal (muted) quando expandido, funcionando como titulo discreto do grupo. Apenas o subitem ativo ("Privadas" ou "Gerais") tem destaque com cor primary e barra lateral.

