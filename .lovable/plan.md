

# Redesign Cases/Portfólio -- Banco de Cases com Dialog (igual Dores)

## O que muda

A seção "Cases / Portfólio" atual (formulários inline) será substituída pelo mesmo padrão da seção de Dores:

1. **Na página**: grid de cards dos cases selecionados (com thumbnail Vimeo + título + descrição + botão X)
2. **Botão "Adicionar Cases"** abre um Dialog grande com o banco completo (`proposal_cases`)
3. No dialog, o usuário seleciona cases existentes OU cria um novo -- e o novo **fica salvo** no banco `proposal_cases`

## Mudanças

### 1. Importar `useProposalCases` e redesenhar seção em `ProposalDetails.tsx`

**Cards de cases selecionados**: Grid 2 colunas com cards mostrando:
- Thumbnail do Vimeo (via `https://vimg.net/video/{vimeoId}`)
- Tipo (tag), Título, Descrição
- Toggle destaque (estrela)
- Botão X para remover

**Dialog "Banco de Cases"** (`sm:max-w-4xl`):
- Lista de todos os cases do banco (`useProposalCases`) como cards clicáveis com checkbox visual
- Filtro/busca por texto (client_name, campaign_name, tags)
- Cases já na proposta aparecem marcados
- Seção "Criar novo case" com campos: client_name, campaign_name, vimeo_id, vimeo_hash, tags, destaque -- ao criar, chama `createCase` do hook e o case fica salvo no banco + adicionado à proposta
- Rodapé fixo com contador + botão Confirmar

### 2. Mapeamento banco → proposta
- O campo JSONB `cases` da proposta armazena `{ tipo, titulo, descricao, vimeoId, vimeoHash, destaque }`
- Ao selecionar do banco, copiar os dados relevantes para o array local (sem referência ao ID)
- Ao criar novo, salvar no banco via mutation E adicionar ao array local

### 3. Remover lógica inline atual
- Remover `addCase`, `removeCase`, `updateCase` inline
- Substituir pelo padrão de seleção do banco + confirmação

## Arquivos alterados
- `src/pages/ProposalDetails.tsx` -- redesign completo da seção de cases com dialog do banco

