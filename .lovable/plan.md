

# Plano: Reestruturar Sidebar com Modo Expandido/Recolhido

## Visao Geral

Transformar a sidebar desktop de somente icones (w-16) para uma sidebar com dois estados:
- **Expandida**: icones + texto + busca (similar a referencia Firstbase)
- **Recolhida**: somente icones (estado atual)

Tambem atualizar o visual do mobile sidebar para consistencia.

---

## Arquitetura da Mudanca

```text
Antes:
  Desktop: sidebar fixa w-16 (somente icones)
  Mobile: Sheet lateral com texto

Depois:
  Desktop: sidebar com toggle expandida (w-64) / recolhida (w-16)
  Mobile: Sheet lateral com visual atualizado
```

---

## Arquivos a Modificar

| Arquivo | Tipo de Mudanca |
|---------|----------------|
| `src/components/Layout/DesktopSidebar.tsx` | **Reescrever** - adicionar dois estados, busca, header "Hiro Hub" |
| `src/components/Layout/MobileSidebar.tsx` | **Atualizar** - novo visual, header "Hiro Hub", busca |
| `src/components/Layout/Layout.tsx` | **Atualizar** - ajustar `pl-16` para ser dinamico conforme estado |
| `src/components/Layout/SidebarUserProfile.tsx` | **Atualizar** - suportar estado expandido/recolhido no desktop |
| `src/components/Layout/TopBar.tsx` | Sem alteracao |
| `src/components/Layout/SidebarTools.tsx` | **Remover** - consolidar no DesktopSidebar |
| `src/lib/z-index.ts` | Sem alteracao |

---

## Detalhes Tecnicos

### 1. Estado da Sidebar (DesktopSidebar)

Usar `localStorage` para persistir a preferencia do usuario:

```text
Estado: "expanded" | "collapsed"
Padrao: "expanded"
Persistencia: localStorage("sidebar-expanded")
Transicao: CSS transition em width (300ms ease-in-out)
```

A sidebar tera:
- **w-64** quando expandida (256px)
- **w-16** quando recolhida (64px)
- Animacao suave de transicao

### 2. Header da Sidebar

**Expandida:**
```text
[Logo HIRO] Hiro Hub          [<< toggle]
```

**Recolhida:**
```text
   [Logo]
   [>> toggle]
```

O botao toggle usa icones `PanelLeftClose` / `PanelLeft` do lucide-react.

### 3. Busca Rapida

Adicionar campo de busca abaixo do header (visivel apenas quando expandida):

```text
[ Q  Buscar...              Ctrl+K ]
```

Funcionalidades:
- Filtra itens de navegacao em tempo real pelo nome
- Atalho de teclado `Ctrl+K` / `Cmd+K` para focar
- Quando recolhida, mostra apenas icone de lupa (clica para expandir sidebar e focar busca)

### 4. Layout Dinamico (Layout.tsx)

O `main` content area precisa reagir ao estado da sidebar:

```text
Expandida: pl-64 (padding-left: 256px)
Recolhida: pl-16 (padding-left: 64px)
Transicao: CSS transition em padding-left (300ms ease-in-out)
```

Implementacao: usar React Context para compartilhar estado da sidebar entre `DesktopSidebar` e `Layout`.

### 5. Mecanismo de Compartilhamento de Estado

Aproveitar o `SidebarProvider` ja existente do shadcn (`useSidebar`), que ja tem:
- `state: "expanded" | "collapsed"`
- `open / setOpen`
- `toggleSidebar()`
- Atalho de teclado `Ctrl+B`

No `DesktopSidebar`, usar `useSidebar()` em vez de estado local, assim o `Layout.tsx` tambem acessa o estado via `useSidebar()`.

### 6. Navegacao - Visual dos Links

**Expandida:**
```text
  | [icone]  Nome do Item        |   <- item ativo com bg highlight
  |  [icone]  Nome do Item       |   <- item normal
```

**Recolhida (icones com tooltip):**
```text
  | [icone] |  <- tooltip no hover mostra nome
```

Manter o indicador visual de item ativo (barra lateral colorida a esquerda).

### 7. SidebarUserProfile - Adaptacao

**Expandida:** Avatar + nome + email (como no mobile atual)
**Recolhida:** Apenas avatar (como esta hoje)

### 8. Mobile Sidebar - Atualizacoes Visuais

- Header: "Hiro Hub" em vez de "Sistema de Inventario"
- Adicionar campo de busca abaixo do header
- Manter Sheet lateral com mesma mecanica
- Mesmo filtro de busca do desktop

### 9. Secao Admin

Manter separador e label "Administracao" quando expandida. Quando recolhida, manter apenas separador visual.

---

## Fluxo de Interacao

```text
1. Usuario abre app -> sidebar expandida (ou ultimo estado salvo)
2. Clica no botao toggle -> sidebar recolhe com animacao
3. Hover em icone recolhido -> tooltip com nome
4. Clica no toggle novamente -> sidebar expande
5. Ctrl+B -> toggle da sidebar
6. Ctrl+K -> foca na busca (expande se estiver recolhida)
7. Digita na busca -> filtra itens de navegacao
8. Redimensiona para mobile -> sidebar fecha, TopBar aparece
```

---

## Riscos e Mitigacoes

| Risco | Mitigacao |
|-------|-----------|
| Quebrar layout de paginas | Usar CSS transition no padding-left, sem mudanca no conteudo |
| z-index conflitos | Manter hierarquia atual de z-index |
| PWA safe areas | Preservar logica `env(safe-area-inset-top)` existente |
| Navigation blocker | Manter `requestNavigation` hook como esta |
| Performance | CSS transitions sao GPU-accelerated, sem re-render desnecessario |
| Persistencia | localStorage e sincrono e rapido |

---

## Ordem de Implementacao

1. Integrar `useSidebar()` no `DesktopSidebar` para controlar expand/collapse
2. Reestruturar `DesktopSidebar` com dois estados visuais
3. Atualizar `Layout.tsx` para padding dinamico
4. Atualizar `SidebarUserProfile` para suportar estado expandido
5. Adicionar busca na sidebar
6. Atualizar `MobileSidebar` com novo visual
7. Remover `SidebarTools.tsx` (codigo consolidado)
8. Testar transicoes, PWA, e responsividade

