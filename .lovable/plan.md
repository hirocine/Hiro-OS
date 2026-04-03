

# Skeleton dedicado para a página de Orçamentos

## O que será feito

Substituir o spinner circular (`Loader2`) por um skeleton que espelha fielmente o layout real da página: PageHeader + Card "Ativos" com grid de ProposalCard skeletons + dois headers colapsados (Aprovados e Arquivados).

## Mudanças

### 1. Criar `ProposalCardSkeleton` e `ProposalsPageSkeleton`
**Arquivo**: `src/features/proposals/components/ProposalsSkeleton.tsx`

- `ProposalCardSkeleton` — replica o layout do `ProposalCard`: avatar circle + linhas de texto, badges, info rows, botão
- `ProposalsPageSkeleton` — compõe o layout completo:
  - Header (título + botão "Nova Proposta" desabilitado como skeleton)
  - Card "Ativos" com ícone Clock + título skeleton + grid de 4 ProposalCardSkeletons
  - Dois cards colapsados (Aprovados e Arquivados) — apenas o header com ícone + título skeleton + chevron

### 2. Usar o skeleton na página
**Arquivo**: `src/pages/Proposals.tsx`

- Substituir o bloco `isLoading ? <Loader2 spinner>` pelo `<ProposalsPageSkeleton />`

### Arquivos
- `src/features/proposals/components/ProposalsSkeleton.tsx` (novo)
- `src/pages/Proposals.tsx` (editar bloco de loading)

