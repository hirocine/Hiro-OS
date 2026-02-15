

## Adicionar label "Menu" e mais espaçamento acima da navegação principal

### Alteração em `src/components/Layout/DesktopSidebar.tsx`

1. Adicionar o label **"Menu"** acima dos itens de navegação principal, usando o mesmo estilo do label "Administração" (`text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-6 mb-2`)
2. Aumentar o `pt` (padding-top) do bloco de navegação de `pt-4` para `pt-5` para dar mais respiro entre a busca e o início do menu

### Alteração em `src/components/Layout/MobileSidebar.tsx`

Aplicar a mesma alteração de espaçamento para manter consistência entre desktop e mobile. O mobile já possui o label "Menu", então apenas ajustar o padding se necessário.

### Resultado visual esperado

```text
┌─────────────────────┐
│ [logo] Hiro Hub     │
├─────────────────────┤
│ 🔍 Buscar      ⌘K  │
│                     │
│  MENU               │
│  Home               │
│  Tarefas            │
│  ...                │
│  Plataformas        │
│                     │
│ ─────────────────── │
│  ADMINISTRAÇÃO      │
│  Dashboard          │
│  ...                │
```

