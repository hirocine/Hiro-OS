

# Padronização Visual — Parte 1: Sidebar + Empty States + PageHeader

## 1. Sidebar icons (DesktopSidebar.tsx + MobileSidebar.tsx)

Trocar icons nos `adminNavigation` sub-itens (ambos arquivos tem a mesma estrutura duplicada):

- `Dashboard` → `BarChart3` (era `Users`)
- `Gestão de CAPEX` → `TrendingUp` (era `Users`)
- `Logs de Auditoria` → `ScrollText` (era `Users`)
- `Categorias` → `Layers` (era `Users`)
- `Notificações` → `Bell` (era `Users`)
- `Sistema` → `Cog` (era `Users`)
- `Usuários` → mantém `Users`

Atualizar imports: adicionar `BarChart3, TrendingUp, ScrollText, Layers, Bell, Cog` e remover `Users` duplicado se não mais necessário (ainda usado em Fornecedores parent e Usuários).

## 2. Empty States em 5 páginas

Substituir textos inline pelo componente `EmptyState` de `@/components/ui/empty-state`:

**Proposals.tsx** (3 empty states, linhas 59, 84, 111):
- Ativos: `icon={Receipt}` title="Nenhum orçamento ativo" description="Crie sua primeira proposta comercial" action com navigate
- Aprovados: `icon={CheckCircle}` title="Nenhum orçamento aprovado" description="Orçamentos aprovados pelo cliente aparecerão aqui"
- Arquivados: `icon={Archive}` title="Nenhum orçamento arquivado" description="Orçamentos expirados serão movidos para cá"

**Projects.tsx** (linhas 423-427):
- Substituir `<h3>Nenhuma retirada encontrada</h3>` + texto + botão pelo `EmptyState` icon={Camera}

**AVProjects.tsx** (linhas 66-70):
- Substituir `<div>Nenhum projeto encontrado</div>` por `EmptyState` icon={Film}

**Companies.tsx** (linhas 141-145):
- Substituir `<TableCell>Nenhuma empresa encontrada</TableCell>` por `EmptyState` icon={Building2} (dentro de TableCell com colSpan)

**Suppliers.tsx** (linhas 170-174):
- Substituir `<TableCell>Nenhum fornecedor encontrado</TableCell>` por `EmptyState` icon={UserCheck}

## 3. PageHeader em Profile.tsx

Substituir o header manual (linhas 293-302) por `PageHeader` com:
- title="Meu Perfil"
- subtitle="Gerencie suas informações e preferências"
- actions = botão "Salvar Alterações"

## 4. Páginas de detalhe — sem mudanças

- **CompanyDetails.tsx**: já tem h1 com `company.company_name` (linha 135). OK.
- **SupplierDetails.tsx**: já tem h1 com `supplier.full_name` (linha 142). OK.
- **TaskDetails.tsx**: já tem título editável inline (linha 186-190). OK.
- **ProposalOverview.tsx**: já tem header card com nome do projeto. OK.
- **ProposalDetails.tsx**: já tem breadcrumb + card. Manter como está.

## Arquivos modificados
- `src/components/Layout/DesktopSidebar.tsx` (icons)
- `src/components/Layout/MobileSidebar.tsx` (icons)
- `src/pages/Proposals.tsx` (3 empty states)
- `src/pages/Projects.tsx` (1 empty state)
- `src/pages/AVProjects.tsx` (1 empty state)
- `src/pages/Companies.tsx` (1 empty state)
- `src/pages/Suppliers.tsx` (1 empty state)
- `src/pages/Profile.tsx` (PageHeader)

Nenhum arquivo em `src/features/proposals/components/public/` será alterado.

