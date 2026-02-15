

## Melhorias gerais na sidebar

Baseado na analise do codigo atual, aqui estao as melhorias que faria:

### 1. Rodape: remover bolinha verde e ring do avatar
A bolinha verde de "online" e falsa (nao existe sistema de presenca). O `ring-2 ring-border` no avatar e visual noise desnecessario.

**Arquivo:** `src/components/Layout/SidebarUserProfile.tsx`
- Remover o `<div className="absolute -bottom-0.5 -right-0.5 ...">` (bolinha verde)
- Remover `ring-2 ring-border` do Avatar
- Remover o wrapper `<div className="relative w-8 h-8">` (nao precisa mais ser relative sem a bolinha)

### 2. Rodape: adicionar tooltip no avatar
Como tiramos nome e email, o usuario nao sabe quem esta logado sem clicar. Um tooltip resolve.

**Arquivo:** `src/components/Layout/SidebarUserProfile.tsx`
- Importar `Tooltip, TooltipTrigger, TooltipContent` de `@/components/ui/tooltip`
- Envolver o botao trigger do dropdown com `Tooltip` + `TooltipTrigger` + `TooltipContent` mostrando o nome (usando `avatarData.name` ou `profile?.display_name`)

### 3. Rodape: suavizar borda superior
A borda `border-t border-border` e muito marcada. Suavizar para `border-border/50`.

**Arquivo:** `src/components/Layout/SidebarUserProfile.tsx`
- Trocar `border-t border-border` por `border-t border-border/50`

### 4. Header: remover `border-b` do header do logo
O header ja tem fundo e gap visual suficiente. A borda inferior somada a borda do search cria duas linhas muito proximas.

**Arquivo:** `src/components/Layout/DesktopSidebar.tsx`
- Remover `border-b border-border` do container do header (linha 125)
- Manter `border-b` apenas no search

### 5. Unificar header + search em um unico bloco
Juntar logo e barra de busca no mesmo bloco, eliminando a dupla borda e criando uma area de cabecalho mais coesa.

**Arquivo:** `src/components/Layout/DesktopSidebar.tsx`
- Mesclar o bloco do header (logo) e o bloco do search em um unico `<div>` com `border-b border-border`
- Ajustar padding para acomodar ambos (logo em cima, search embaixo)

### 6. Remover label "Menu"
A label "Menu" acima da navegacao e redundante -- e obvio que sao itens de menu. Remover libera espaco vertical.

**Arquivo:** `src/components/Layout/DesktopSidebar.tsx`
- Remover o `<p className="text-[11px] ... ">Menu</p>` (linha 152-154)
- Manter apenas o label "Administracao" que tem valor informativo real

### Resultado visual esperado

```text
┌─────────────────────┐
│ [logo] Hiro Hub     │
│ 🔍 Buscar      ⌘K  │
├─────────────────────┤
│  Home               │
│  Tarefas            │
│  Projetos AV        │
│  Retiradas          │
│  Inventario         │
│  SSDs e HDs         │
│  Politicas          │
│  Plataformas        │
│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  Administracao      │
│  Dashboard          │
│  Fornecedores       │
│  Admin              │
│                     │
│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ 👤          🌙  🔔  │
└─────────────────────┘
```

Todas as alteracoes sao em dois arquivos: `DesktopSidebar.tsx` e `SidebarUserProfile.tsx`.

