

# Reorganizar navegação lateral — MobileSidebar.tsx

## Arquivo: `src/components/Layout/MobileSidebar.tsx`

### 1. Import
- Adicionar `Megaphone` ao import de lucide-react

### 2. Arrays de navegação
- Renomear `navigation` → `operacoesNavigation`, remover Home e Inventário, conteúdo: Esteira de Pós, Tarefas, Retiradas, Armazenamento, Plataformas, Políticas
- `producaoNavigation` — sem alteração
- Criar `marketingNavigation` com item Referências (`/referencias`, icon: Megaphone)
- `adminNavigation` — adicionar `{ name: 'Inventário', href: '/inventario', icon: Package, adminOnly: true }` entre Financeiro e Admin

### 3. useMemo
- Renomear `filteredNav` → `filteredOperacoesNav`
- Adicionar `filteredMarketingNav` seguindo o mesmo padrão

### 4. useEffect auto-expand por rota
- Renomear `navigation` → `operacoesNavigation`, incluir `marketingNavigation` no `allItems`

### 5. useEffect auto-expand por search
- Renomear `navigation` → `operacoesNavigation`, incluir `marketingNavigation` no `allItems`

### 6. JSX — Seções de navegação
- **Home solo**: NavLink fixo para `/` com icon Home, renderizado ANTES do label "Operações", sem label de seção
- **Operações**: Label "Menu" → "Operações", usar `filteredOperacoesNav`
- **Produção**: Sem alteração
- **Marketing** (novo): Separator + label "MARKETING" + items de `filteredMarketingNav`. Visível para todos, sem condição de role
- **Administração**: Sem alteração na renderização

Nenhum outro arquivo modificado. Componente `MobileNavItemWithChildren` intocado.

