

# Redesign da seção "Dores do Cliente" -- Cards + Dialog com Banco Categorizado

## O que muda

A seção atual (chips de seleção + edição inline) será substituída por:
1. **Na página**: exibição em **cards** das dores selecionadas (emoji + título + descrição) com botão de remover
2. **Botão "Adicionar Dores"** abre um **Dialog grande** com o banco completo organizado por categorias (igual ao HTML enviado)
3. No dialog, o usuário marca/desmarca dores com checkboxes e pode **criar uma dor exclusiva** para o projeto (não salva no banco)

## Mudanças necessárias

### 1. Migration: adicionar campo `category` na tabela `proposal_pain_points`
- Novo campo `category TEXT` para agrupar dores (ex: "Qualidade & padrão visual", "Prazo & velocidade de entrega", etc.)
- Seed das ~40 dores do HTML enviado com suas categorias e emojis

### 2. Atualizar tipo `PainPoint` e hook `usePainPoints`
- Adicionar `category` ao interface `PainPoint`
- Query já funciona com `select('*')`, então pega automaticamente

### 3. Redesenhar seção em `ProposalDetails.tsx`

**Cards de dores selecionadas**: Grid 2 colunas com cards estilo do HTML (emoji + título + descrição + botão X para remover)

**Dialog "Banco de Dores"** (`sm:max-w-4xl`):
- Organizado por categorias com headers numerados (01, 02, 03...)
- Grid 2 colunas de cards clicáveis com checkbox visual
- Dores já selecionadas aparecem marcadas
- Barra fixa no rodapé com contador "X dores selecionadas" + botão "Confirmar"
- Tab ou seção "Dor exclusiva" para criar uma avulsa (emoji + título + desc) que entra direto na proposta sem ir ao banco
- Busca/filtro por texto no topo do dialog

### 4. Remover dialog "Nova Dor" atual
- O dialog antigo de criar nova dor será substituído pelo campo "Dor exclusiva" dentro do novo dialog do banco

## Arquivos alterados
- Nova migration: `add_category_to_pain_points.sql`
- `src/features/proposals/types/index.ts` -- campo `category` em PainPoint
- `src/pages/ProposalDetails.tsx` -- redesign completo da seção de dores

