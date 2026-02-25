

# Remover borda esquerda do ProposalCard

## Alteracao

Remover a `border-l-4` e a logica de cor `getBorderColor()` do `ProposalCard.tsx`.

### `src/features/proposals/components/ProposalCard.tsx`

- **Linha 48-51**: Trocar `"group hover:shadow-lg transition-all duration-300 border-l-4 overflow-hidden", getBorderColor()` por apenas `"group hover:shadow-lg transition-all duration-300 overflow-hidden"`.
- **Linhas 31-37**: Remover a funcao `getBorderColor()` inteira (codigo morto).

