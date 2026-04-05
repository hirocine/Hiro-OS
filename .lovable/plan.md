

# Fase 3 — Sistema de Versionamento de Propostas

## Resumo
Adicionar versionamento a propostas: campos `version`, `parent_id`, `is_latest_version` na tabela `orcamentos`. O usuário pode criar nova versao (copia) ao editar, e versoes anteriores mostram banner na pagina publica.

## 1. Migration SQL (nova)

```sql
ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;
ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.orcamentos(id);
ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS is_latest_version boolean DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_orcamentos_parent_id ON public.orcamentos(parent_id);
```

## 2. Tipos (`src/features/proposals/types/index.ts`)
Adicionar `version: number`, `parent_id: string | null`, `is_latest_version: boolean` na interface `Proposal`.

## 3. Hook `useProposals.ts`
- Adicionar mutation `createNewVersion` que:
  1. Busca proposta original
  2. Calcula `nextVersion` buscando versao mais alta do grupo (parent_id ou id original)
  3. Marca todas versoes anteriores como `is_latest_version: false`
  4. Insere copia com novo slug (`-v{N}`), `version: nextVersion`, `parent_id`, `is_latest_version: true`, `status: 'draft'`, `views_count: 0`
- Atualizar `mapProposal` para incluir os 3 novos campos
- Exportar `createNewVersion` no return

## 4. Dialog de versão no `ProposalDetails.tsx`
- Adicionar states: `showVersionDialog`, `pendingSaveAction`
- Quando usuário clica salvar qualquer secao, em vez de salvar direto, abre Dialog:
  - "Alterar esta versão" → executa save normalmente
  - "Criar nova versão" → chama `createNewVersion`, navega para `/orcamentos/${newId}`
- Importar `createNewVersion` de `useProposals`

## 5. ProposalOverview.tsx
- Badge `v{version}` no header, ao lado do badge de status
- Nova secao "Versões" (antes do placeholder de historico de alteracoes):
  - Busca versoes com query: `or('id.eq.${parentId},parent_id.eq.${parentId}')` ordenado por `version`
  - Lista: cada row com `v{N}`, data de criacao, badge de status, link para overview
  - Versao atual destacada com fundo `bg-muted/50`

## 6. ProposalCard.tsx
- Se `proposal.version > 1`, mostrar badge `v{version}` no card

## 7. ProposalPublicPage.tsx
- Apos carregar a proposta, verificar `is_latest_version`
- Se `false`, buscar slug da versao latest: query `orcamentos` com `parent_id.eq.${parentId},is_latest_version.eq.true`
- Renderizar banner amarelo discreto no topo: "Esta é uma versão anterior. Ver versão atual →"

## 8. useProposalDetails.ts
- Adicionar `version`, `parent_id`, `is_latest_version` no mapeamento de retorno

## Arquivos criados/modificados
- **Nova migration** SQL
- `src/features/proposals/types/index.ts`
- `src/features/proposals/hooks/useProposals.ts`
- `src/features/proposals/hooks/useProposalDetails.ts`
- `src/features/proposals/hooks/useProposalDetailsById.ts`
- `src/pages/ProposalDetails.tsx`
- `src/pages/ProposalOverview.tsx`
- `src/features/proposals/components/ProposalCard.tsx`
- `src/features/proposals/components/ProposalPublicPage.tsx`

Nenhum arquivo em `src/features/proposals/components/public/` sera alterado.

