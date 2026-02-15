

## Redesign do estilo ativo dos subitens da sidebar

### Problema atual

Quando um subitem esta ativo (ex: "Gerais"), ele recebe a barra lateral azul (indicador primary) e texto azul. O item mae ("Tarefas") fica neutro. O usuario quer inverter essa logica visual.

### Nova logica visual

- **Item mae** ("Tarefas"): Quando qualquer filho esta ativo e o menu esta expandido, o item mae recebe a barra lateral indicadora (a mesma barra branca/primary de 3px na lateral esquerda)
- **Subitem ativo** ("Gerais"): Em vez da barra lateral, usa texto verde (`text-success`) + negrito (`font-semibold`), sem barra indicadora
- **Subitem inativo** ("Privadas"): Continua com `text-muted-foreground` e hover normal

### Detalhes tecnicos

**Arquivos**: `DesktopSidebar.tsx` e `MobileSidebar.tsx`

**No item mae (div pai dentro de `NavItemWithChildren`)**:
- Quando `childActive && expanded`: mostrar a barra lateral (`w-[3px] h-6 bg-primary`) e aplicar `text-foreground font-medium`
- Quando `parentActive && !expanded`: manter comportamento atual

**Nos subitens (NavLink dentro do CollapsibleContent)**:
- Remover a barra lateral (`div` com `bg-primary`)
- Ativo: `text-success font-semibold` (verde + negrito)
- Icone ativo: `text-success`
- Inativo: sem mudanca

**Cor verde**: Ja existe no projeto como `success` (`--success: 142 76% 36%`), disponivel via `text-success`.

### Resultado visual esperado

```text
| Tarefas          <-- barra lateral branca/primary, texto normal
    Gerais         <-- texto verde + negrito, SEM barra
    Privadas       <-- texto cinza (muted)
```
