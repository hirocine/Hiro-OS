

# Dores do Cliente como Banco Pré-Configurado

## O que muda
A seção "Dores do Cliente" deixa de ser apenas campos livres. Passa a funcionar como um **seletor de banco de dores** (tabela `proposal_pain_points` já existente) onde o usuário:
1. Seleciona dores do banco existente (multi-select / lista com checkboxes)
2. Ao selecionar, a dor é copiada para o formulário da proposta e pode ser **editada localmente** (sem alterar o banco)
3. Pode **adicionar uma nova dor** que vai tanto para o banco quanto para a proposta atual
4. Pode remover dores selecionadas da proposta

## Plano

### 1. Buscar dores do banco
- Importar e usar o hook `usePainPoints()` já existente no `ProposalDetails.tsx`
- Ele retorna todas as dores cadastradas na tabela `proposal_pain_points`

### 2. UI de seleção + edição
- No topo da seção, adicionar um **dropdown/combobox multi-select** com as dores do banco
- Ao selecionar uma dor do banco, ela é adicionada ao `doresForm` com os valores pré-preenchidos (label, title, desc)
- Dores já selecionadas aparecem marcadas no dropdown
- Cada dor no formulário continua editável inline (campos Label, Título, Descrição) -- edições são locais à proposta
- Botão "Adicionar Nova Dor" abre um mini-form para criar uma nova dor, que é salva no banco via `createPainPoint` e automaticamente adicionada à proposta

### 3. Mapeamento banco → proposta
- O campo `diagnostico_dores` da proposta armazena `{label, title, desc}` -- sem referência ao ID do banco
- Ao selecionar do banco, copiar `{label: pp.label, title: pp.title, desc: pp.description}` para o array local
- Isso permite edição livre sem afetar o banco original

### 4. Arquivos alterados
- `src/pages/ProposalDetails.tsx` -- importar `usePainPoints`, redesenhar a seção de dores com seletor + edição inline

