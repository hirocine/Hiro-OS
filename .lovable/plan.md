

# Adicionar seções faltantes na página de detalhes da proposta

## Contexto
A página `ProposalDetails.tsx` atualmente só tem: Cliente/Projeto, Investimento, Objetivo e Depoimento. Faltam 3 seções que existem no modelo de dados: **Dores do Cliente** (`diagnostico_dores`), **Cases/Portfólio** (`cases`), e **Entregas e Serviços** (`entregaveis`).

## Plano

### 1. Seção "Dores do Cliente" (diagnostico_dores)
- Card com lista editável de dores (label, title, desc)
- Cada dor tem 3 campos inline (Label, Título, Descrição)
- Botão "Adicionar Dor" para inserir novas
- Botão "X" para remover individualmente
- Salva como array JSONB no campo `diagnostico_dores`

### 2. Seção "Cases / Portfólio" (cases)
- Card com lista dos cases selecionados (tipo, titulo, descricao, vimeoId, vimeoHash, destaque)
- Cada case editável inline com campos: Tipo, Título, Descrição, Vimeo ID, Vimeo Hash, Destaque (switch)
- Botão para adicionar/remover cases
- Salva como array JSONB no campo `cases`

### 3. Seção "Entregas e Serviços" (entregaveis)
- O campo `entregaveis` é um JSONB com blocos: "Output" (entregas) e "Serviços" (incluso)
- **Bloco Output**: lista de itens com titulo, descricao, quantidade, icone — editável inline
- **Bloco Serviços**: cards de categorias com itens toggle (ativo/inativo) — editável com checkboxes
- Botões para adicionar/remover itens em cada bloco
- Salva tudo junto no campo `entregaveis`

### 4. Estado e salvamento
- Novos estados: `doresForm`, `casesForm`, `entregaveisForm`
- Dirty checks para cada seção
- Botão "Salvar" por seção, chamando `saveSection` com o campo correspondente
- População dos forms no `useEffect` existente

### Detalhes técnicos
- Arquivo editado: `src/pages/ProposalDetails.tsx`
- Todos os dados já existem no modelo `Proposal` e são retornados pelo hook `useProposalDetailsById`
- Nenhuma mudança de banco de dados necessária

