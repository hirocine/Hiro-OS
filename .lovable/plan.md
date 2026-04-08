

# Duplicar Orçamento

## Resumo
Adicionar opção "Duplicar" no menu kebab do ProposalCard e criar uma mutation `duplicateProposal` no hook `useProposals`.

## Alterações

### 1. `src/features/proposals/hooks/useProposals.ts`
- Adicionar mutation `duplicateProposal` que:
  - Busca o orçamento original por ID (`select('*')`)
  - Remove `id`, `created_at`, `updated_at`, `views_count`
  - Gera novo slug: `generateSlug(original.client_name, original.project_name)` + random suffix
  - Insere como novo registro independente (sem `parent_id`, `version: 1`, `is_latest_version: true`)
  - Altera `project_name` para `"{nome} (Cópia)"`
  - Status: `draft`, `views_count: 0`, `sent_date: hoje`
- Retornar `duplicateProposal` no objeto do hook (linha 301)

### 2. `src/features/proposals/components/ProposalCard.tsx`
- Adicionar prop `onDuplicate?: (id: string) => void`
- Importar `CopyPlus` de lucide-react (ícone diferente de Copy para distinguir)
- Adicionar item no DropdownMenu entre "Copiar Link" e o separador do Excluir:
  ```
  <DropdownMenuItem onClick={() => onDuplicate?.(proposal.id)}>
    <CopyPlus className="mr-2 h-4 w-4" /> Duplicar
  </DropdownMenuItem>
  ```

### 3. `src/pages/Proposals.tsx`
- Extrair `duplicateProposal` do hook `useProposals()`
- Passar `onDuplicate={(id) => duplicateProposal.mutate(id)}` ao ProposalCard

