

## Permitir fechar submenus clicando no nome

### Problema

Atualmente, clicar no nome do item pai (ex: "Tarefas") navega para a rota pai, mas nao fecha/abre o submenu. So o icone (area do chevron) faz toggle do submenu.

### Solucao

Transformar o `NavLink` do nome em um elemento clicavel que:
- **Se o menu esta colapsado**: expande o submenu (e navega para a rota pai)
- **Se o menu esta expandido**: apenas fecha o submenu (sem navegar)

Na pratica, trocar o `NavLink` por um `<span>` com `onClick` que faz toggle do `expanded`, e so navega quando esta colapsado.

### Detalhes tecnicos

**Arquivos**: `DesktopSidebar.tsx` (linhas 160-167) e `MobileSidebar.tsx` (linhas 118-124)

Substituir o `NavLink` do nome por:

```tsx
<span
  onClick={() => {
    if (expanded) {
      setExpanded(false);
    } else {
      setExpanded(true);
    }
  }}
  className="text-sm truncate flex-1 cursor-pointer"
>
  {item.name}
</span>
```

Isso remove a navegacao ao clicar no nome e transforma em puro toggle de expansao/colapso. A navegacao para subitens ja e feita pelos proprios subitens dentro do submenu.

### Comportamento esperado

- Clicar no nome "Tarefas" quando fechado -> abre o submenu
- Clicar no nome "Tarefas" quando aberto -> fecha o submenu
- Clicar no icone/chevron -> mesma coisa (toggle)
- Clicar nos subitens "Gerais"/"Privadas" -> navega normalmente

