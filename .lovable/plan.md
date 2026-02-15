

## Box agrupadora envolvendo item pai + subitens

### Conceito

Quando o grupo esta expandido, uma unica box de fundo (rounded, bg-muted ou similar) envolve o item pai ("Tarefas") e todos os subitens ("Gerais", "Privadas"), criando um visual de agrupamento. Os subitens ficam alinhados no mesmo padding esquerdo do pai -- sem indentacao extra. O subitem ativo recebe destaque de texto/cor mas sem box propria.

### Estrutura HTML proposta

```text
<div class="rounded-lg bg-muted/50 p-1">       <-- box agrupadora (so aparece quando expanded)
  <div class="flex items-center ...">            <-- item pai (Tarefas)
    [chevron] [nome]
  </div>
  <Collapsible>
    <NavLink class="flex items-center px-3 py-2.5 ...">  <-- subitem, mesmo padding do pai
      [icon] Gerais
    </NavLink>
    <NavLink ...>
      [icon] Privadas
    </NavLink>
  </Collapsible>
</div>
```

### Visual esperado

```text
  Home
  ┌─────────────────────────┐
  │ v  Tarefas              │  <-- fundo sutil envolvendo tudo
  │ 👥 Gerais    (destaque) │
  │ 🔒 Privadas             │
  └─────────────────────────┘
  Projetos AV
```

Quando colapsado, a box desaparece e "Tarefas" volta a ser um item normal como os outros.

### Detalhes tecnicos

**`src/components/Layout/DesktopSidebar.tsx`** -- componente `NavItemWithChildren`:

1. O `<div>` raiz do componente recebe classes condicionais: quando `expanded`, aplica `rounded-lg bg-muted/50 p-1` (ou similar) para criar a box agrupadora. Quando colapsado, sem fundo.
2. O item pai perde o `rounded-lg` e `hover:bg-muted` proprios quando expandido (ja que o fundo vem do container).
3. Remover `ml-3 pl-3` do container dos subitens -- os subitens usam o mesmo `px-3 py-2.5 gap-3` dos itens normais, alinhados a esquerda.
4. Icones dos subitens com `h-[18px] w-[18px]` (mesmo tamanho do pai).
5. Subitem ativo: apenas `text-primary font-medium`, sem `bg-primary/10` proprio (o fundo ja vem do container agrupador).
6. Subitem hover (nao ativo): `hover:bg-background/60 rounded-lg` para um destaque sutil dentro da box.

**`src/components/Layout/MobileSidebar.tsx`**: mesmas alteracoes para manter consistencia.

### Animacao

- A box agrupadora aparece/desaparece junto com a expansao dos subitens, usando a animacao de collapsible ja existente.
- Como o fundo esta no container externo, basta aplicar `transition-colors duration-200` para um fade suave do fundo ao expandir/colapsar.

