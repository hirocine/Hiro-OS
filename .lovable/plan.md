

## Separar Fornecedores em "Freelancers" e "Empresas"

### Visao Geral

Transformar o item "Fornecedores" na sidebar em um menu expansivel (igual a "Tarefas") com dois subitens: **Freelancers** (usando a tabela `suppliers` existente) e **Empresas** (nova tabela `supplier_companies`).

### 1. Banco de Dados - Nova tabela `supplier_companies`

Criar migration com:

```text
supplier_companies
- id (uuid, PK)
- company_name (text, NOT NULL)
- area (text, NOT NULL) -- ex: "Locacao de Equipamentos", "Pos-Producao"
- rating (integer, nullable)
- whatsapp (text, nullable)
- instagram (text, nullable)
- portfolio_url (text, nullable)
- is_active (boolean, default true)
- created_by (uuid, nullable)
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())
```

RLS: mesmas politicas da tabela `suppliers` (admin-only para CRUD).

Tambem criar tabela `supplier_company_notes` com a mesma estrutura de `supplier_notes` para notas internas das empresas.

### 2. Sidebar - Menu expansivel

Alterar `DesktopSidebar.tsx` e `MobileSidebar.tsx`:

```text
Fornecedores (expansivel, igual Tarefas)
  -> Freelancers  (/fornecedores/freelancers)
  -> Empresas     (/fornecedores/empresas)
```

Usar o mesmo componente `NavItemWithChildren` ja existente.

### 3. Rotas (App.tsx)

```text
/fornecedores          -> Redirect para /fornecedores/freelancers
/fornecedores/freelancers  -> Pagina Freelancers (atual Suppliers.tsx renomeado)
/fornecedores/empresas     -> Nova pagina Companies
/fornecedores/freelancers/:id  -> Detalhes do freelancer (atual SupplierDetails)
/fornecedores/empresas/:id     -> Detalhes da empresa (novo)
```

### 4. Pagina Freelancers

Renomear/adaptar `Suppliers.tsx` para ser a pagina de Freelancers:
- Titulo: "Freelancers"
- Subtitulo: "Gerencie sua rede de freelancers"
- Colunas: Nome, Funcao, Expertise, Rating, Diaria Media, Contatos, Acoes (sem mudancas)
- Rota de navegacao para detalhes: `/fornecedores/freelancers/:id`

### 5. Pagina Empresas (nova)

Nova pagina `Companies.tsx` seguindo a mesma estrutura:
- Titulo: "Empresas"
- Subtitulo: "Gerencie suas empresas fornecedoras"
- Colunas da tabela: **Empresa** | **Area** | **Rating** | **Contatos** | **Acoes**
- Mesmos componentes de contato (WhatsApp/Instagram)
- Dialog de criacao/edicao similar ao SupplierDialog

### 6. Pagina Detalhes da Empresa (nova)

Nova pagina `CompanyDetails.tsx` similar a `SupplierDetails.tsx`:
- Cards de informacoes gerais (empresa, area, rating)
- Card de contatos (WhatsApp, Instagram, Portfolio)
- Sistema de notas internas (usando `supplier_company_notes`)

### 7. Feature module `supplier-companies`

Criar em `src/features/supplier-companies/`:
- `types/index.ts` - tipos Company, CompanyInsert, CompanyUpdate, CompanyFilters
- `hooks/useCompanies.ts` - CRUD similar a useSuppliers
- `hooks/useCompanyNotes.ts` - notas similar a useSupplierNotes
- `components/CompanyDialog.tsx` - form de criar/editar empresa
- `components/CompanyFilters.tsx` - filtros (busca, area, rating)

### 8. Breadcrumbs

Atualizar breadcrumbs:
- Freelancer details: `Fornecedores > Freelancers > Nome`
- Empresa details: `Fornecedores > Empresas > Nome da Empresa`

### Resumo dos arquivos

| Acao | Arquivo |
|------|---------|
| Editar | `DesktopSidebar.tsx`, `MobileSidebar.tsx` (menu expansivel) |
| Editar | `App.tsx` (novas rotas) |
| Editar | `Suppliers.tsx` (adaptar para Freelancers) |
| Editar | `SupplierDetails.tsx` (ajustar breadcrumbs/rotas) |
| Criar | Migration SQL (tabelas) |
| Criar | `src/features/supplier-companies/` (types, hooks, components) |
| Criar | `src/pages/Companies.tsx` |
| Criar | `src/pages/CompanyDetails.tsx` |

