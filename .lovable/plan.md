

## Subitens colapsaveis na sidebar (estilo Notion)

### Conceito

Itens da sidebar que possuem sub-ferramentas exibem um comportamento interativo no hover: o icone original faz um fade-out e uma seta (ChevronRight) aparece no lugar. Ao clicar na seta, os subitens expandem abaixo com animacao suave. O item pai continua clicavel para navegar a sua rota principal.

### Estrutura de dados

Atualizar o tipo `NavigationItem` para suportar children:

```typescript
interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  children?: NavigationItem[];
}
```

Primeiro caso de uso -- Tarefas:

```typescript
{
  name: 'Tarefas',
  href: '/tarefas',
  icon: CheckSquare,
  children: [
    { name: 'Gerais', href: '/tarefas/gerais', icon: Users },
    { name: 'Privadas', href: '/tarefas/privadas', icon: Lock },
  ]
}
```

### Rotas

Adicionar novas rotas no `App.tsx`:
- `/tarefas` -- redireciona para `/tarefas/gerais`
- `/tarefas/gerais` -- renderiza Tasks com section="general"
- `/tarefas/privadas` -- renderiza Tasks com section="private"
- `/tarefas/:id` -- permanece igual (detalhes de tarefa)

A pagina `Tasks.tsx` recebera a section como prop ou via route param, eliminando as tabs de secao principal (general/private) do topo da pagina.

### Comportamento do NavItem com children

1. **Estado normal**: exibe o icone original + nome normalmente
2. **Hover**: o icone original faz fade-out (opacity 0) e um ChevronRight/ChevronDown faz fade-in no mesmo lugar (opacity 1), com transicao de ~150ms
3. **Clique no icone/seta**: toggle expand/collapse dos children
4. **Clique no nome**: navega para a rota principal (`/tarefas`)
5. **Expandido**: subitens aparecem abaixo, indentados, com animacao de altura (slide down)
6. **Auto-expand**: se a rota atual esta dentro dos children (ex: `/tarefas/gerais`), o grupo abre automaticamente

### Animacoes

- **Icone fade**: `transition-opacity duration-150` no icone original e na seta, controlados por estado de hover
- **Expand/collapse dos subitens**: usar a animacao `collapsible-down`/`collapsible-up` ja existente no projeto (Radix Collapsible), ou CSS com `max-height` e `overflow: hidden`
- **Seta rotacao**: ChevronRight rotaciona 90 graus para ChevronDown quando expandido (`transition-transform duration-200 rotate-90`)

### Detalhes tecnicos

#### Arquivos a modificar

1. **`src/components/Layout/DesktopSidebar.tsx`**
   - Atualizar tipo `NavigationItem` com campo `children`
   - Atualizar array `navigation` com children em Tarefas
   - Criar componente `NavItemWithChildren` que:
     - Gerencia estado `expanded` (local) e `hovered`
     - No hover: troca icone por chevron com fade
     - No clique da area do chevron: toggle expand
     - No clique do texto: navega
     - Renderiza subitens dentro de um container colapsavel
   - Subitens usam padding-left maior (pl-9) para indentacao
   - Auto-expand baseado na rota atual

2. **`src/components/Layout/MobileSidebar.tsx`**
   - Mesma logica aplicada, adaptada para mobile
   - No mobile, como nao ha hover, o chevron fica sempre visivel ao lado do nome quando ha children

3. **`src/App.tsx`**
   - Adicionar rotas `/tarefas/gerais` e `/tarefas/privadas`
   - Rota `/tarefas` redireciona para `/tarefas/gerais`

4. **`src/pages/Tasks.tsx`**
   - Remover as tabs de secao principal (general/private) do topo
   - Receber a secao via URL (useParams ou prop)
   - Manter o conteudo interno (calendar, summary, table com sub-tabs)

#### Estrutura visual do subitem expandido

```text
  MENU
  Home
  v Tarefas          <-- chevron aparece no hover, rotaciona quando aberto
     Gerais           <-- subitem indentado
     Privadas         <-- subitem indentado
  Projetos AV
  Retiradas
  ...
```

#### Estado persistente

O estado de expand/collapse sera local (useState). Porem, se a rota atual pertence a um grupo de children, o grupo abre automaticamente via useEffect.

