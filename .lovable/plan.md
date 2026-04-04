

# Melhorar visualmente a seção Serviços Inclusos

## Atual

Três colunas simples com título em texto e checkboxes empilhados, sem diferenciação visual entre colunas nem hierarquia clara. Aparência de formulário genérico.

## Proposta

Transformar cada coluna em um **card estilizado** com cabeçalho destacado, bordas sutis, e melhor hierarquia entre categorias e subcategorias.

```text
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ 🎬 Pré-Produção │  │ 🎥 Gravação     │  │ ✂️ Pós-Produção │
│─────────────────│  │─────────────────│  │─────────────────│
│ ☐ Roteiro       │  │ ☐ Captação      │  │ ☐ Edição        │
│ ☐ Storyboard    │  │ ☐ Iluminação    │  │ ☐ Color         │
│                 │  │                 │  │                 │
│ ▸ Direção       │  │ ▸ Áudio         │  │ ▸ Motion        │
│   ☐ Dir. Cena   │  │   ☐ Boom        │  │   ☐ Lower       │
│   ☐ Dir. Arte   │  │   ☐ Lapela      │  │   ☐ Transição   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Alterações

**Arquivo: `src/pages/ProposalDetails.tsx` (linhas ~1202-1237)**

1. Envolver cada coluna em um card com `border rounded-xl p-5 bg-muted/30`
2. Cabeçalho com ícone de fase (emoji do `icone` da categoria ou fallback) + título em `font-semibold text-sm` com um `border-b pb-3 mb-3`
3. Subcategorias com label `uppercase tracking-wider text-[10px] text-muted-foreground font-semibold` e padding-left sutil
4. Checkboxes com `hover:bg-muted/50 rounded px-2 py-1.5 -mx-2` para efeito de hover row
5. Badge de contagem de itens ativos no cabeçalho (ex: "4/7")

