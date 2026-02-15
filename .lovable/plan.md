
## Melhorar a secao de ferramentas no rodape da sidebar

### Problema
A secao de "Notificacoes" e "Tema" no fundo da sidebar esta visualmente desalinhada e sem acabamento. O layout atual mistura um wrapper manual (div com flex) para Notificacoes com o componente ThemeSwitcher que ja e um botao, criando inconsistencia de padding e alinhamento.

### Solucao

No arquivo `src/components/Layout/DesktopSidebar.tsx`, linhas 193-204:

1. Remover o wrapper manual de "Notificacoes" -- o `NotificationPanel` ja renderiza um botao, entao o label "Notificacoes" e o wrapper sao redundantes e criam problemas de alinhamento
2. Transformar a secao em dois botoes side-by-side (icones apenas) com um layout compacto e limpo, usando `flex` horizontal
3. Melhorar o border-top para ter mais contraste

```text
De:
┌─────────────────────┐
│ 🔔  Notificações    │
│ 🌙  Tema            │
└─────────────────────┘

Para:
┌─────────────────────┐
│   🔔        🌙      │
└─────────────────────┘
```

### Codigo

Substituir linhas 193-204 por:

```tsx
{/* Tools - Bottom */}
<div className="border-t border-border px-3 py-3 shrink-0">
  <div className="flex items-center justify-center gap-1">
    <NotificationPanel />
    <ThemeSwitcher />
  </div>
</div>
```

Isso coloca os dois icones lado a lado, centralizados, sem labels redundantes. Fica muito mais limpo e profissional -- similar ao padrao de sidebars modernas (Notion, Linear, etc).
