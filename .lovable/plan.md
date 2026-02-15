

## Diferenciar visualmente item pai vs subitem ativo na sidebar

### Problema

Quando um subitem esta selecionado (ex: "Privadas"), tanto o pai "Tarefas" quanto o subitem parecem ter o mesmo nivel visual, sem diferenciacao clara. O hover dos subitens tambem precisa de ajuste para ficar harmonioso dentro da box agrupadora.

### Solucao

1. **Item pai quando expandido**: sempre exibido com `text-foreground font-semibold` (negrito sutil, sem cor de destaque). Ele funciona como "titulo do grupo", nao como item ativo.

2. **Subitem ativo**: recebe uma barra lateral esquerda (`w-[3px] bg-primary`) e `text-primary font-medium`, similar aos itens normais ativos mas sem fundo proprio (o fundo ja vem da box agrupadora).

3. **Subitem hover (nao ativo)**: `hover:bg-background/80 rounded-lg` -- um fundo levemente mais claro que a box agrupadora, criando contraste sutil.

4. **Item pai hover quando expandido**: sem hover background (ja esta dentro da box).

### Visual esperado

```text
  Home
  ┌─────────────────────────┐
  │    Tarefas  (semibold)   │
  │ |  Gerais   (primary)    │  <-- barra lateral + cor primary
  │    Privadas              │  <-- texto muted, hover sutil
  └─────────────────────────┘
  Projetos AV
```

### Alteracoes tecnicas

**`src/components/Layout/DesktopSidebar.tsx`** -- `NavItemWithChildren`:

1. Item pai (div linha ~110-121): quando `expanded`, usar `text-foreground font-semibold` (sem hover bg). Quando colapsado, manter comportamento atual.

2. Subitens (NavLink linha ~166-179): subitem ativo recebe `relative` + barra lateral `absolute left-0 w-[3px] h-5 bg-primary rounded-r-full` + `text-primary font-medium pl-3`. Subitem inativo: `text-muted-foreground hover:bg-background/80 hover:text-foreground rounded-lg`.

**`src/components/Layout/MobileSidebar.tsx`** -- mesmas alteracoes.

### Resultado

O pai "Tarefas" fica como cabecalho do grupo (bold, sem cor). O subitem ativo tem barra lateral colorida como diferenciador claro. Nenhum conflito visual entre pai e filho.

