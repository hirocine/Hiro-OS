

## Eliminar a secao intermediaria e integrar ferramentas ao perfil do usuario

### Problema
A secao com os icones de notificacao e tema ficou "solta" entre a navegacao e o perfil -- parece uma area vazia sem proposito claro. Sidebars modernas (Linear, Notion, Slack) nao tem essa faixa intermediaria.

### Solucao
Mover os botoes de notificacao e tema para dentro da barra do perfil do usuario, ao lado do chevron. Isso elimina a secao intermediaria e cria um rodape unico, compacto e coeso.

```text
Antes:
┌─────────────────────┐
│  ...navegacao...     │
├─────────────────────┤
│      🔔    🌙       │  <-- secao solta
├─────────────────────┤
│ 👤 Nome       ⌃⌄    │
└─────────────────────┘

Depois:
┌─────────────────────┐
│  ...navegacao...     │
├─────────────────────┤
│ 👤 Nome   🔔 🌙 ⌃⌄  │  <-- tudo junto
└─────────────────────┘
```

### Alteracoes

**1. `src/components/Layout/DesktopSidebar.tsx`**
- Remover completamente o bloco "Tools - Bottom" (linhas 193-199)
- O componente fica apenas com ScrollArea + SidebarUserProfile

**2. `src/components/Layout/SidebarUserProfile.tsx`**
- Adicionar imports de `NotificationPanel` e `ThemeSwitcher`
- Inserir os dois botoes entre o bloco de texto (nome/email) e o icone ChevronsUpDown
- Os botoes ficam fora do DropdownMenuTrigger para nao interferir no clique do menu
- Ajustar o layout: o trigger do dropdown encapsula apenas avatar + nome, e os botoes de ferramentas ficam ao lado

Estrutura do novo footer:
```tsx
<div className="border-t border-border bg-card/50 p-2 shrink-0">
  <div className="flex items-center gap-1 w-full p-1.5">
    {/* Avatar + Nome (clicavel, abre dropdown) */}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 flex-1 min-w-0 p-1.5 hover:bg-accent/50 rounded-lg">
          <Avatar ... />
          <div className="flex-1 min-w-0 text-left">
            <p>Nome</p>
            <p>email</p>
          </div>
          <ChevronsUpDown />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent ... />
    </DropdownMenu>

    {/* Ferramentas */}
    <div className="flex items-center shrink-0">
      <NotificationPanel />
      <ThemeSwitcher />
    </div>
  </div>
</div>
```

Isso cria um rodape limpo e profissional, sem secoes intermediarias vazias.

