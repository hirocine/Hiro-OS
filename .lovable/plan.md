

## Corrigir sub-menus que nao fecham ao clicar em outro item

### Problema

No componente `NavItemWithChildren`, o estado `expanded` e local e o auto-collapse depende de `anyActive` mudar para `false`. Quando o usuario expande um menu (ex: "Fornecedores") sem navegar para nenhum filho, `anyActive` ja era `false` antes do clique. Ao clicar em outro item da sidebar, `anyActive` continua `false` — nao muda — entao o `useEffect` de collapse nao dispara.

### Solucao

Levantar o controle de qual menu esta expandido para o `DesktopSidebar`. Um estado `expandedItem` (string | null) no componente pai garante que apenas um menu pode estar expandido por vez:

- Clicar em um item com filhos: define `expandedItem` para aquele item (ou fecha se ja era ele)
- Clicar em qualquer outro item da sidebar (com ou sem filhos): limpa `expandedItem`
- Navegacao para um filho: mantem `expandedItem` aberto automaticamente

### Mudancas no arquivo `src/components/Layout/DesktopSidebar.tsx`

**1. No `DesktopSidebar`**: adicionar estado `expandedItem`

```tsx
const [expandedItem, setExpandedItem] = useState<string | null>(null);
```

Auto-abrir quando a rota atual corresponde a um filho:

```tsx
useEffect(() => {
  const allItems = [...navigation, ...adminNavigation];
  for (const item of allItems) {
    if (item.children?.some(c => isActive(c.href))) {
      setExpandedItem(item.name);
      return;
    }
  }
}, [location.pathname]);
```

**2. Em `NavItemWithChildren`**: receber `expanded` e `onToggle` como props em vez de estado local

```tsx
function NavItemWithChildren({ item, isActive, onNavClick, isAdmin, expanded, onToggle }) {
  // remover useState(expanded) e useEffects de auto-collapse
  // usar a prop expanded diretamente
  // onClick do header chama onToggle()
}
```

**3. Em `NavItem`**: ao clicar, fechar qualquer menu expandido

Passar `onNavClick` modificado ou adicionar um callback `onClearExpanded` que limpa `expandedItem` ao clicar em itens sem filhos.

**4. Tambem aplicar a mesma logica no `MobileSidebar.tsx`** se ele tiver a mesma estrutura.

### Arquivo editado

- `src/components/Layout/DesktopSidebar.tsx`
- Possivelmente `src/components/Layout/MobileSidebar.tsx` (se aplicavel)

Nenhuma dependencia nova. Apenas refatoracao de estado local para estado compartilhado.

