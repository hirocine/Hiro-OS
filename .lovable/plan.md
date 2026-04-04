

# Unificar criação e edição de propostas na mesma página

## Resumo

Eliminar o Wizard (`ProposalWizard`) e a página `NewProposal`. O botão "Nova Proposta" criará um registro draft no banco com valores placeholder e redirecionará para `/orcamentos/:id`, onde o usuário edita tudo na mesma interface que já existe.

## Alterações

### 1. Migration: tornar `client_name`, `project_name` e `validity_date` nullable

Esses campos são NOT NULL hoje, o que impede criar um registro vazio. Alternativa: inserir com placeholders ("Sem nome", etc.), mas isso polui o banco. Melhor: `ALTER COLUMN ... DROP NOT NULL` para os 3 campos, permitindo criar um draft realmente vazio.

### 2. Adaptar `useProposals.ts` - nova mutation `createDraft`

Nova mutation simples que:
- Gera slug temporário (`rascunho-<random>`)
- Insere registro mínimo: `{ slug, status: 'draft', created_by }`
- Retorna o `id` do registro criado

### 3. Página de listagem (`Proposals.tsx`) - botão "Nova Proposta"

Trocar `navigate('/orcamentos/novo')` por: chamar `createDraft`, aguardar o id, navegar para `/orcamentos/:id`.

### 4. `ProposalDetails.tsx` - suportar modo criação

- Dirty checks: quando `proposal` tem campos vazios/null, considerar qualquer preenchimento como dirty (já funciona naturalmente, pois compara com `''` ou `null`)
- `saveSection`: já usa `updateProposal.mutateAsync` com o id - funciona igual
- Ao salvar `client_name` + `project_name` pela primeira vez, regenerar o slug automaticamente (chamando update com novo slug)
- Breadcrumb: mostrar "Nova Proposta" quando `client_name` estiver vazio
- Esconder botão "Ver Proposta" e dropdown de status enquanto `client_name` estiver vazio

### 5. Rota e limpeza

- Remover rota `/orcamentos/novo` do `App.tsx`
- Remover import de `NewProposal`
- O arquivo `NewProposal.tsx` e `ProposalWizard.tsx` podem ser mantidos temporariamente mas não serão mais referenciados

### 6. Slug auto-update

Quando o usuário salva a seção "Cliente" e tanto `client_name` quanto `project_name` estão preenchidos, incluir no payload de update um novo `slug` gerado (reaproveitando a função `generateSlug` que já existe em `useProposals.ts`). Extrair essa função para poder reutilizá-la.

