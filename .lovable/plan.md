

## Ajustes visuais nos subitens da sidebar

### 1. Remover a linha vertical (border-l)

Remover o `border-l border-border` do container dos subitens em `DesktopSidebar.tsx` (linha 153) e no `MobileSidebar.tsx`. Os subitens continuam indentados, mas sem a linha vertical conectando-os.

### 2. Apenas o subitem ativo fica destacado (não o pai)

Quando um child está ativo, o item pai "Tarefas" não deve ficar com fundo colorido nem com a barra lateral. Ele mantém apenas o texto normal (como se não estivesse selecionado). Somente o subitem clicado (ex: "Gerais") recebe o destaque visual (bg-primary/10, text-primary, barra lateral).

### Detalhes técnicos

**`src/components/Layout/DesktopSidebar.tsx`** -- componente `NavItemWithChildren`:

- Linha 109-112: trocar `anyActive` por `parentActive` na classe do container pai. Assim, o fundo colorido só aparece quando o usuario navega diretamente para `/tarefas`, não quando está em `/tarefas/gerais`.
- Linha 117-118: trocar `anyActive` por `parentActive` na barra lateral esquerda do pai.
- Linha 130: trocar `anyActive` por `parentActive` na cor do ícone.
- Linha 136: trocar `anyActive` por `parentActive` na cor do chevron.
- Linha 153: remover `border-l border-border` do container dos subitens.

**`src/components/Layout/MobileSidebar.tsx`** -- aplicar as mesmas alterações de lógica (parentActive em vez de anyActive) e remover border-l dos subitens.

### Resultado visual esperado

```text
  Tarefas              <-- sem destaque (texto normal)
     Gerais             <-- destacado (bg-primary/10 + barra lateral)
     Privadas           <-- sem destaque
```

