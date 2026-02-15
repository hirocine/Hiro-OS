

## Adicionar padding e borda nos subitens da sidebar ao hover

### Problema

Quando o mouse passa sobre um subitem (ex: "Gerais", "Privadas"), o hover (`bg-background/80`) ocupa toda a largura do container `bg-muted/50`, criando a impressao visual de que o hover se funde com o fundo do grupo expandido. Falta separacao visual.

### Solucao

Adicionar um pequeno recuo lateral no container dos subitens e uma borda sutil no hover de cada subitem, criando uma separacao clara entre o fundo do grupo e o hover do item.

### Mudancas tecnicas

**Arquivo: `src/components/Layout/DesktopSidebar.tsx`**

1. No container dos subitens (linha 160), adicionar padding lateral `px-1.5` para que os subitens fiquem ligeiramente recuados em relacao ao fundo do grupo:

```tsx
// De:
<div className="mt-0.5 space-y-0.5">

// Para:
<div className="mt-0.5 space-y-0.5 px-1.5 pb-1.5">
```

2. No hover dos subitens (linha 172), adicionar uma borda sutil:

```tsx
// De:
"text-muted-foreground hover:bg-background/80 hover:text-foreground"

// Para:
"text-muted-foreground hover:bg-background/80 hover:text-foreground hover:border hover:border-border/50"
```

Nota: como `border` adiciona 1px que pode causar layout shift, usar `border border-transparent` como estado padrao para reservar o espaco:

```tsx
// Classe base do subitem:
"flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm border border-transparent"

// Hover inativo:
"hover:bg-background/80 hover:text-foreground hover:border-border/50"
```

**Arquivo: `src/components/Layout/MobileSidebar.tsx`**

Aplicar a mesma mudanca nos subitens do mobile para consistencia.

### Resultado

- Subitens ficam com um recuo lateral dentro do grupo expandido
- No hover, aparece uma borda sutil que separa visualmente o item do fundo do grupo
- Sem layout shift gracas ao `border-transparent` como estado padrao

### Arquivos editados

- `src/components/Layout/DesktopSidebar.tsx`
- `src/components/Layout/MobileSidebar.tsx`

Nenhuma dependencia nova.
