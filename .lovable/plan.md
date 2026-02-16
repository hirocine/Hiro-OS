

## Adicionar Role "Producao" ao Sistema

### Resumo

Criar uma nova role `producao` que fica entre o usuario comum e o administrador. Usuarios com essa role terao acesso a ferramentas de fornecedores (Freelancers e Empresas) na sidebar, mas **nao** terao acesso ao Dashboard Financeiro nem ao painel de Admin.

### Hierarquia de Acesso

```text
+-------------------+------------------+---------------------+---------------------+
|    Ferramenta      | Usuario (user)   | Producao (producao) | Admin (admin)       |
+-------------------+------------------+---------------------+---------------------+
| Menu principal     |       Sim        |        Sim          |       Sim           |
| Fornecedores       |       Nao        |        Sim          |       Sim           |
| Dashboard Financ.  |       Nao        |        Nao          |       Sim           |
| Admin              |       Nao        |        Nao          |       Sim           |
+-------------------+------------------+---------------------+---------------------+
```

### Etapas

**1. Migracao de Banco de Dados**

Adicionar o valor `producao` ao enum `app_role` existente:

```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'producao';
```

Atualizar a funcao `get_all_users_with_roles` para incluir a nova role.

Adicionar RLS policies para que usuarios com role `producao` possam acessar as tabelas de fornecedores (`suppliers`, `supplier_roles`, `supplier_notes`, `supplier_companies`, `supplier_company_notes`).

**2. AuthContext (`src/contexts/AuthContext.tsx`)**

- Adicionar `producao` ao tipo `UserRole`: `'admin' | 'user' | 'producao'`
- Adicionar propriedade derivada `isProducao` e `canAccessSuppliers` (true para admin e producao)
- Manter `isAdmin` apenas para role `admin`

**3. Sidebar - Desktop e Mobile**

Reestruturar a navegacao em 3 grupos:

- **Menu principal** (todos os usuarios): Home, Tarefas, Projetos AV, Retiradas, Inventario, SSDs, Politicas, Plataformas
- **Producao** (producao + admin): Fornecedores (Freelancers, Empresas)
- **Administracao** (admin apenas): Dashboard Financeiro, Admin

Arquivos afetados:
- `src/components/Layout/DesktopSidebar.tsx`
- `src/components/Layout/MobileSidebar.tsx`
- `src/components/Layout/Sidebar.tsx`

**4. Protecao de Rotas nas Paginas**

Atualizar as paginas que verificam `isAdmin` para usar a logica correta:

- `src/pages/Suppliers.tsx`, `src/pages/SupplierDetails.tsx`, `src/pages/Companies.tsx`, `src/pages/CompanyDetails.tsx`: Mudar de `isAdmin` para `canAccessSuppliers` (permitir producao + admin)
- `src/pages/Dashboard.tsx`, `src/pages/Admin.tsx`: Manter apenas `isAdmin`

**5. RoleGuard e useUserRole**

- Atualizar `src/components/RoleGuard.tsx`: Adicionar `producao` ao tipo `UserRole`
- Atualizar `src/hooks/useUserRole.ts`: Adicionar `producao` ao tipo

**6. Painel Admin - Gerenciamento de Usuarios**

Atualizar o formulario de edicao/criacao de usuarios em `src/pages/Admin.tsx` para incluir a opcao de atribuir a role `producao` no dropdown de roles.

### Detalhes Tecnicos

**Migracao SQL:**
```sql
-- Adicionar novo valor ao enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'producao';

-- Adicionar policies para producao acessar fornecedores
CREATE POLICY "Producao can view suppliers"
ON public.suppliers FOR SELECT
USING (has_role(auth.uid(), 'producao'::app_role));

-- (Repetir para INSERT, UPDATE, DELETE em suppliers, supplier_roles, supplier_notes, supplier_companies, supplier_company_notes)
```

**AuthContext - novas propriedades:**
```typescript
export type UserRole = 'admin' | 'user' | 'producao';

// No provider:
const canAccessSuppliers = role === 'admin' || role === 'producao';
```

**Sidebar - novo grupo de navegacao:**
```typescript
const producaoNavigation: NavigationItem[] = [
  {
    name: 'Fornecedores', href: '/fornecedores', icon: Users,
    children: [
      { name: 'Freelancers', href: '/fornecedores/freelancers', icon: UserCheck },
      { name: 'Empresas', href: '/fornecedores/empresas', icon: Building2 },
    ],
  },
];

const adminOnlyNavigation: NavigationItem[] = [
  { name: 'Dashboard Financeiro', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Admin', href: '/administracao', icon: Settings, children: [...] },
];

// Renderizacao:
// producaoNavigation visivel se canAccessSuppliers
// adminOnlyNavigation visivel se isAdmin
```

### Arquivos Editados

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Adicionar `producao` ao enum, criar RLS policies para fornecedores |
| `src/contexts/AuthContext.tsx` | Adicionar `producao` ao tipo, `canAccessSuppliers` |
| `src/components/Layout/DesktopSidebar.tsx` | Separar navegacao em 3 grupos |
| `src/components/Layout/MobileSidebar.tsx` | Separar navegacao em 3 grupos |
| `src/components/Layout/Sidebar.tsx` | Atualizar navegacao |
| `src/pages/Suppliers.tsx` | Usar `canAccessSuppliers` |
| `src/pages/SupplierDetails.tsx` | Usar `canAccessSuppliers` |
| `src/pages/Companies.tsx` | Usar `canAccessSuppliers` |
| `src/pages/CompanyDetails.tsx` | Usar `canAccessSuppliers` |
| `src/components/RoleGuard.tsx` | Adicionar `producao` ao tipo |
| `src/hooks/useUserRole.ts` | Adicionar `producao` ao tipo |
| `src/pages/Admin.tsx` | Adicionar opcao `producao` no dropdown de roles |

