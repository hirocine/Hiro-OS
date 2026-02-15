

# Plano: Sidebar Fixa (Sempre Expandida)

## Objetivo

Simplificar a sidebar removendo toda a logica de recolher/expandir. A sidebar ficara sempre fixa em **w-64** no desktop, sempre mostrando icones + texto + busca.

## O que muda

### 1. `src/components/Layout/DesktopSidebar.tsx`

- Remover imports: `PanelLeftClose`, `PanelLeft`, `Tooltip`, `TooltipContent`, `TooltipTrigger`, `useSidebar`, `Button`
- Remover `useSidebar()` e variavel `expanded`
- Remover efeito de "clear search when collapsing"
- Remover logica de "if !expanded toggleSidebar" no Ctrl+K
- Sidebar sempre `w-64`, sem `transition-[width]`
- Header: sempre mostra logo + "Hiro Hub", sem botao toggle
- Busca: sempre visivel (remover estado colapsado com icone de lupa)
- NavItem: simplificar removendo prop `expanded` e logica de tooltip (sempre mostra texto)
- Tools (bottom): sempre mostra com label (remover branch de icone-only)

### 2. `src/components/Layout/Layout.tsx`

- Remover `useSidebar()` e variavel `expanded`
- Remover `getDefaultSidebarOpen()` e `SidebarProvider`
- Main content: fixar `pl-64` no desktop, remover `transition-[padding-left]`
- Simplificar: nao precisa mais do wrapper `LayoutContent` separado

### 3. `src/components/Layout/SidebarUserProfile.tsx`

- Remover import e uso de `useSidebar`
- Remover logica condicional de `expanded` - sempre mostrar detalhes no desktop
- Simplificar: `showDetails` sempre `true`

### 4. `src/components/Layout/MobileSidebar.tsx`

- Remover import de `useSidebar` (se usado apenas para toggle)
- Verificar se `openMobile`/`setOpenMobile` ainda funciona sem `SidebarProvider`
- Se necessario, criar estado local simples para controlar abertura do Sheet mobile

## Impacto

- **Codigo removido**: ~80 linhas de logica condicional
- **Nenhuma quebra**: sidebar fica no estado "expandida" permanentemente, que ja funciona
- **Performance**: menos re-renders (sem estado de toggle)
- **Mobile**: sem alteracao funcional, apenas remocao de dependencia do SidebarProvider se possivel

## Risco

O `MobileSidebar` usa `useSidebar()` para `openMobile`/`setOpenMobile`. Precisamos manter o `SidebarProvider` ou migrar o controle do Sheet mobile para estado local. Vou verificar a melhor abordagem durante a implementacao -- provavelmente manter o `SidebarProvider` apenas para o mobile e ignorar o estado expand/collapse no desktop.

