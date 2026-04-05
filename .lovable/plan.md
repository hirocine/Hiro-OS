

# Redirecionar "Editar" do ProposalCard para a página intermediária (Overview)

## Problema
No `ProposalCard.tsx`, o botão "Editar" navega diretamente para `/orcamentos/:id` (página de edição). O usuário quer que ele vá primeiro para a página intermediária de Overview (`/orcamentos/:id/overview`), de onde já existe um botão "Editar" que leva à edição.

## Mudança

### Arquivo: `src/features/proposals/components/ProposalCard.tsx`

1. **Botão "Editar" (linha 139)**: trocar `/orcamentos/${proposal.id}` por `/orcamentos/${proposal.id}/overview`
2. **MenuItem "Editar" no dropdown (linha 97)**: mesma troca — `/orcamentos/${proposal.id}` por `/orcamentos/${proposal.id}/overview`

Nenhuma outra mudança. A página de Overview já tem o botão "Editar" que leva para `/orcamentos/:id`.

