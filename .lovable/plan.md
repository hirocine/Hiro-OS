

## Renomear "Projetos AV" para "Projetos" e Mover para Producao

### Resumo

Renomear o item de navegacao "Projetos AV" para "Projetos" e move-lo do menu principal para a secao "Producao", tornando-o visivel apenas para usuarios com role `producao` ou `admin`.

### Mudancas

**1. Sidebar - Desktop, Mobile e Legada**

Remover "Projetos AV" do array `navigation` (menu principal) e adiciona-lo ao array `producaoNavigation` (secao Producao):

```text
Antes:
  Menu Principal: Home, Tarefas, [Projetos AV], Retiradas, Inventario, ...
  Producao: Fornecedores

Depois:
  Menu Principal: Home, Tarefas, Retiradas, Inventario, ...
  Producao: Projetos, Fornecedores
```

Arquivos: `DesktopSidebar.tsx`, `MobileSidebar.tsx`, `Sidebar.tsx`

**2. Paginas AVProjects e AVProjectDetails**

Adicionar verificacao `canAccessSuppliers` (que cobre `admin` e `producao`) para proteger o acesso. Usuarios sem permissao verao uma mensagem de acesso negado ou serao redirecionados.

Arquivos: `AVProjects.tsx`, `AVProjectDetails.tsx`

**3. Rotas (App.tsx)**

As rotas `/projetos-av` e `/projetos-av/:id` permanecem inalteradas no roteador - a protecao sera feita no nivel da pagina (mesmo padrao usado em Suppliers/Companies).

### Arquivos editados

| Arquivo | Acao |
|---------|------|
| `src/components/Layout/DesktopSidebar.tsx` | Mover "Projetos" de navigation para producaoNavigation |
| `src/components/Layout/MobileSidebar.tsx` | Mesma mudanca |
| `src/components/Layout/Sidebar.tsx` | Mesma mudanca |
| `src/pages/AVProjects.tsx` | Adicionar guard `canAccessSuppliers` |
| `src/pages/AVProjectDetails.tsx` | Adicionar guard `canAccessSuppliers` |

