

# Remover skeleton e carregar a página diretamente

## Problema
Os itens da página de Orçamentos aparecem "dessincronizados" — provavelmente porque o skeleton aparece brevemente e depois a transição para o conteúdo real acontece de forma abrupta, com cards e imagens carregando em tempos diferentes.

## Solução
Remover o skeleton da página de Orçamentos e renderizar o conteúdo diretamente. O ProtectedRoute já tem seu próprio spinner enquanto a autenticação carrega, e os dados do Supabase retornam rápido o suficiente para não precisar de um estado intermediário.

### Mudanças

**`src/pages/Proposals.tsx`**:
- Remover o import do `ProposalsPageSkeleton`
- Remover o bloco `if (isLoading) return <ProposalsPageSkeleton />`
- Deixar a página renderizar diretamente (com listas vazias enquanto carrega, já que `proposals || []` já trata isso)

**`src/features/proposals/components/ProposalsSkeleton.tsx`**:
- Deletar o arquivo (não será mais usado)

