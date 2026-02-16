

## Pesquisa na Sidebar Incluindo Sub-itens

### Problema

A busca na sidebar atualmente so filtra pelos nomes dos itens pai. Quando voce digita "das" (como na imagem), o item "Tarefas" aparece porque contem "das", mas os sub-itens como "Dashboard" (dentro de Financeiro) nao aparecem. Alem disso, o filtro de admin (`filteredAdminNav`) so verifica o nome do pai, ignorando completamente os filhos.

### Solucao

1. **Corrigir filtro do admin** para tambem verificar nomes dos filhos (igual ja funciona para `filteredNav` e `filteredProducaoNav`)

2. **Auto-expandir itens quando um filho corresponde a busca** - se o usuario digitar "dash", o grupo "Financeiro" deve aparecer expandido mostrando o sub-item "Dashboard"

3. **Aplicar nos dois sidebars** (Desktop e Mobile) de forma consistente

4. **Respeitar roles** - a filtragem ja acontece depois da verificacao de `canAccessSuppliers` e `isAdmin`, entao itens restritos continuam invisiveis

### Detalhes Tecnicos

**Arquivos editados:**

| Arquivo | Acao |
|---------|------|
| `src/components/Layout/DesktopSidebar.tsx` | Corrigir filtro admin para incluir filhos; auto-expandir ao buscar |
| `src/components/Layout/MobileSidebar.tsx` | Mesma correcao |

**Mudancas no filtro (`DesktopSidebar.tsx` e `MobileSidebar.tsx`):**

Corrigir `filteredAdminNav` para incluir filhos:
```typescript
// De:
adminNavigation.filter(item => item.name.toLowerCase().includes(query))

// Para:
adminNavigation.filter(item =>
  item.name.toLowerCase().includes(query) ||
  item.children?.some(c => c.name.toLowerCase().includes(query))
)
```

**Auto-expansao ao buscar:**

Adicionar um `useEffect` que, quando `searchQuery` nao esta vazio, encontra o primeiro item pai cujo filho corresponde a busca e expande-o automaticamente:

```typescript
useEffect(() => {
  if (!searchQuery) return;
  const query = searchQuery.toLowerCase();
  const allItems = [
    ...navigation,
    ...(canAccessSuppliers ? producaoNavigation : []),
    ...(isAdmin ? adminNavigation : []),
  ];
  const match = allItems.find(item =>
    item.children?.some(c => c.name.toLowerCase().includes(query))
  );
  if (match) setExpandedItem(match.name);
}, [searchQuery, canAccessSuppliers, isAdmin]);
```

Isso garante que ao digitar "dash", o grupo "Financeiro" expande automaticamente mostrando "Dashboard" como resultado.

