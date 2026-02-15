

## Recolher subitens ao sair da ferramenta "Tarefas"

### Problema

Atualmente, ao navegar para fora de "Tarefas" (ex: clicar em "Home"), os subitens permanecem expandidos. O esperado e que recolham automaticamente.

### Solucao

Adicionar um `useEffect` que monitora quando `anyActive` (pai ou filho ativo) se torna `false` e fecha o grupo automaticamente.

### Alteracoes

**`src/components/Layout/DesktopSidebar.tsx`** e **`src/components/Layout/MobileSidebar.tsx`** -- no componente `NavItemWithChildren`, apos o useEffect existente (linha ~100-103), adicionar:

```tsx
// Auto-collapse when leaving the section entirely
useEffect(() => {
  if (!anyActive) setExpanded(false);
}, [anyActive]);
```

### Resultado

Ao clicar em qualquer item fora de "Tarefas", o grupo se recolhe automaticamente. Ao voltar para "Tarefas" ou um subitem, expande novamente.

