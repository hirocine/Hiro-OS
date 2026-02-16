

## Transformar "Dashboard Financeiro" em "Financeiro" com Subitens

### Resumo

O item "Dashboard Financeiro" na sidebar sera transformado em um item pai "Financeiro" com dois subitens: "Dashboard" (pagina atual) e "Fluxo de Caixa" (pagina nova, inicialmente em branco).

### Mudancas

**1. Sidebar - Desktop e Mobile (`DesktopSidebar.tsx` e `MobileSidebar.tsx`)**

Substituir o item simples:
```text
Dashboard Financeiro  ->  /dashboard
```

Por um item pai com filhos:
```text
Financeiro
  Dashboard        ->  /financeiro/dashboard
  Fluxo de Caixa   ->  /financeiro/fluxo-de-caixa
```

Usar o icone `LayoutDashboard` para o pai. Os filhos usarao o padrao de ponto (bullet) ja existente nos outros submenus.

**2. Sidebar legada (`Sidebar.tsx`)**

Atualizar a mesma estrutura para manter consistencia.

**3. Rotas (`App.tsx`)**

- Adicionar redirect: `/financeiro` -> `/financeiro/dashboard`
- Mover rota do Dashboard: `/dashboard` -> `/financeiro/dashboard`
- Manter redirect antigo `/dashboard` -> `/financeiro/dashboard` para compatibilidade
- Adicionar nova rota: `/financeiro/fluxo-de-caixa` -> nova pagina `CashFlow`

**4. Nova pagina `src/pages/CashFlow.tsx`**

Pagina simples com PageHeader "Fluxo de Caixa" e um estado vazio indicando que a funcionalidade esta em desenvolvimento. Mantera a mesma verificacao de `isAdmin` que o Dashboard usa.

### Arquivos editados

| Arquivo | Acao |
|---------|------|
| `src/components/Layout/DesktopSidebar.tsx` | Transformar "Dashboard Financeiro" em item pai "Financeiro" com subitens |
| `src/components/Layout/MobileSidebar.tsx` | Mesma mudanca |
| `src/components/Layout/Sidebar.tsx` | Mesma mudanca |
| `src/App.tsx` | Adicionar rotas `/financeiro/*` e redirect de `/dashboard` |
| `src/pages/CashFlow.tsx` | Criar pagina em branco para Fluxo de Caixa |

