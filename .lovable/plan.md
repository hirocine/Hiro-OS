

# Reorganizar navegação lateral — DesktopSidebar.tsx

## Resumo

Reorganizar os 4 grupos de navegação no sidebar: Home (solo) → Operações → Produção → Marketing (novo) → Administração (com Inventário).

## Mudanças no arquivo `src/components/Layout/DesktopSidebar.tsx`

### 1. Import
- Adicionar `Megaphone` ao import de lucide-react

### 2. Arrays de navegação (linhas 23-65)
- Renomear `navigation` → `operacoesNavigation`, remover Home e Inventário, reordenar (Esteira de Pós, Tarefas, Retiradas, Armazenamento, Plataformas, Políticas)
- `producaoNavigation` — sem alteração
- `adminNavigation` — adicionar `{ name: 'Inventário', href: '/inventario', icon: Package, adminOnly: true }` entre Financeiro e Admin
- Criar `marketingNavigation` com item Referências (`/referencias`, icon: Megaphone)

### 3. useMemo (linhas 241-261)
- Renomear `filteredNav` → `filteredOperacoesNav`
- Adicionar `filteredMarketingNav` seguindo o mesmo padrão

### 4. useEffect auto-expand por rota (linha 205)
- Incluir `marketingNavigation` no array `allItems`
- Renomear referência de `navigation` → `operacoesNavigation`

### 5. useEffect auto-expand por search (linhas 218-220)
- Incluir `marketingNavigation` no array `allItems`
- Renomear referência de `navigation` → `operacoesNavigation`

### 6. JSX — Seções de navegação (linhas 308-404)
- **Home solo**: Renderizar um NavItem fixo para Home (`/`, icon: Home) ANTES do label "Operações", sem label de seção
- **Operações**: Label "Menu" → "Operações", usar `filteredOperacoesNav`
- **Produção**: Sem alteração
- **Marketing** (novo bloco): Separator + label "MARKETING" + itens de `filteredMarketingNav`. Visível para todos (sem condição de role)
- **Administração**: Sem alteração na renderização (os dados já mudam via array)

Nenhum outro arquivo modificado.

