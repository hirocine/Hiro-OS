

# Reestruturar cards de Entregáveis: layout 2 colunas com quantidade destacada

## Problema
Hoje a quantidade aparece como número solto no canto superior direito do card, sem clareza de que representa a quantidade do entregável.

## Solução
Refatorar o layout dos cards da seção "Entregáveis" (apenas o bloco `bloco.itens`, não os `cards` de Serviços) para um layout horizontal 2-colunas com divisor vertical verde escuro.

## Arquivo
`src/features/proposals/components/public/ProposalEntregaveis.tsx` (linhas 75-96, bloco do `bloco.itens.map`)

⚠️ **Atenção memory rule** `mem://constraints/proposals-public-components-integrity`: o arquivo está em `components/public/` que normalmente é intocável para tarefas admin. **Esta tarefa é explicitamente sobre a UI pública da proposta** (alteração visual solicitada pelo usuário para o que o cliente vê), então a alteração é legítima e escopada apenas a esse componente público.

## Novo layout do card

```text
┌──────────────────────────────────┬──────┐
│ [icon]                           │      │
│                                  │      │
│ Título do entregável             │  25+ │
│ Descrição em uma ou duas linhas  │      │
│                                  │      │
└──────────────────────────────────┴──────┘
```

- **Padding card**: 18px
- **Coluna esquerda**: ícone (mantido), título, descrição — fluxo vertical
- **Divisor**: `border-l border-[#1f3d26]` (1px, verde bem escuro — Tailwind não tem 0.5px nativo; usamos 1px que é o mínimo prático)
- **Coluna direita**: quantidade centralizada (flex center)
  - `min-w-[56px]`, `pl-4`
  - Fonte: `text-[42px] font-medium tracking-[-0.03em] text-[#4CFF5C]`
  - Sem label, sem sufixo
- **Gap entre colunas**: 16px

## Mudanças adicionais
- Remover o número grande fantasma (`text-[#4CFF5C]/20`) que ficava sobreposto no header do card.
- Remover o `flex items-start justify-between` que dividia o header em ícone + número.
- Card vira `flex` horizontal (`flex gap-4`), com a coluna esquerda em `flex-1` e a direita com `min-w-[56px]`.
- Se `item.quantidade` não existir, esconder a coluna direita inteira (sem divisor) para não criar espaço vazio.

## Grid externo
Manter `grid grid-cols-1 md:grid-cols-3 gap-5` como está (gap atual 5 = 20px; o usuário pediu 12px, então **ajustar para `gap-3`**).

## Bloco de Serviços (`cards`)
**Não alterar** — a estrutura desses cards (com checklists internos) é diferente e não foi mencionada no pedido.

## Escopo
- 1 arquivo, ~25 linhas alteradas no bloco `itens`
- 0 mudanças em DB, types, admin ou outros componentes
- Componente público alterado intencionalmente (escopo exato do pedido)

