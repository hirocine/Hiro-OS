

# Ajustar grid de cards dos Orçamentos para 3 colunas

## O que muda

O grid atual vai de 1 a 5 colunas (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`), fazendo os cards ficarem estreitos demais em telas grandes e cortando textos.

Vamos limitar a **3 colunas no máximo**, deixando os cards mais largos e legíveis.

## Alteração

**Arquivo: `src/pages/Proposals.tsx`**
- Trocar o grid de `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5` para `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Isso se aplica a todas as 3 seções (Ativos, Aprovados, Arquivados), pois usam a mesma função `renderGrid`

