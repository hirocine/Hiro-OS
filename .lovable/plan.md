

# Move CRM from Menu to Produção section

## Changes (3 files)

### 1. `src/components/Layout/DesktopSidebar.tsx`
- **Remove** `{ name: 'CRM', href: '/crm', icon: Users }` from `navigation` array (line 32)
- **Add** `{ name: 'CRM', href: '/crm', icon: Users }` to `producaoNavigation` array after Orçamentos, before Fornecedores (between lines 37 and 38)

### 2. `src/components/Layout/MobileSidebar.tsx`
- **Remove** `{ name: 'CRM', href: '/crm', icon: Users }` from `navigation` array (line 35)
- **Add** `{ name: 'CRM', href: '/crm', icon: Users }` to `producaoNavigation` array after Orçamentos, before Fornecedores (between lines 40 and 41)

### 3. `src/components/Layout/Sidebar.tsx`
- **Remove** `{ name: 'CRM', href: '/crm', icon: Handshake }` from `navigation` array (line 22)
- **Add** `{ name: 'CRM', href: '/crm', icon: Handshake }` to `producaoNavigation` array after Orçamentos, before Freelancers (between lines 34 and 36)
- Update icon import: ensure `Handshake` is still imported (already is)

CRM will inherit the Produção section's visibility logic (`canAccessSuppliers` / producao+admin role check), matching all other items in that section.

