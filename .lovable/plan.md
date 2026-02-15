

## Corrigir alinhamento do grupo expandido na sidebar

### Problema

O `p-1` permanente no container do grupo "Tarefas" empurra todos os itens 4px para dentro, desalinhando-os em relação a "Home", "Projetos AV" e os demais itens da sidebar.

### Solução

Remover o `p-1` do container agrupador. O fundo `bg-muted/50 rounded-lg` continuará criando o efeito visual de agrupamento sem adicionar padding interno que desloca os itens.

### Alterações

**`src/components/Layout/DesktopSidebar.tsx`** -- container do `NavItemWithChildren`:

Trocar:
```tsx
"transition-colors duration-200 p-1 rounded-lg",
expanded ? "bg-muted/50" : "bg-transparent"
```

Por:
```tsx
"transition-colors duration-200 rounded-lg",
expanded ? "bg-muted/50" : "bg-transparent"
```

**`src/components/Layout/MobileSidebar.tsx`** -- mesma alteração.

### Resultado

"Tarefas", "Gerais", "Privadas" ficam perfeitamente alinhados com "Home", "Projetos AV" e os demais itens. O fundo sutil do grupo se mantém sem deslocar nada.

