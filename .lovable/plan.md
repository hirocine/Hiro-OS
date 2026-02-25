

# Fix: UrgencyBar sobrepondo o Header

## Problema

A `UrgencyBar` é `fixed top-0`, então ela fica por cima do `ProposalHeader` que agora é estático (não fixo). Os botões do header ficam escondidos atrás da barra de urgência.

## Solução

Adicionar um `padding-top` ou `margin-top` no conteúdo abaixo da UrgencyBar para compensar a altura dela (~40px). A forma mais limpa: manter a UrgencyBar fixa e adicionar um espaçador abaixo dela.

## Alterações

| Arquivo | Alteração |
|---|---|
| `ProposalPublicPage.tsx` | Adicionar um `div` espaçador (`h-10`) logo após a UrgencyBar para empurrar o header para baixo da barra fixa |

Apenas 1 linha adicionada — um `<div className="h-10" />` entre a UrgencyBar e o ProposalHeader dentro do wrapper `print:hidden`, para compensar a altura fixa da barra.

