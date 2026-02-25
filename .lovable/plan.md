

# Plano: Reestruturar a Home de Orcamentos + Novo Card + Logo do Cliente

## Problema Atual

A pagina `/orcamentos` usa uma lista flat com filtros por botoes de status. Nao segue o padrao visual da pagina de Retiradas (`Projects.tsx`), que organiza os itens em secoes com `Card` + `CardHeader` + icone, e usa `Collapsible` para secoes ocultas.

O card atual (`ProposalCard`) e muito simples: nao tem logo/imagem, nao tem dropdown de acoes, e nao segue a estrutura do `ProjectSummaryCard`.

## Alteracoes Necessarias

### 1. Banco de Dados: Adicionar coluna `client_logo` a tabela `orcamentos`

- Nova coluna `client_logo text NULL` para armazenar a URL da imagem/logo do cliente no Storage.
- Migration SQL simples: `ALTER TABLE orcamentos ADD COLUMN client_logo text;`

### 2. Tipos: Atualizar `Proposal` e `ProposalFormData`

**`src/features/proposals/types/index.ts`:**
- Adicionar `client_logo: string | null` em `Proposal`
- Adicionar `client_logo_file: File | null` e `client_logo_preview: string` em `ProposalFormData`

### 3. Wizard Step 1: Adicionar campo de upload de logo

**`src/features/proposals/components/ProposalWizard.tsx`:**
- No Step 1 (Dados Basicos), adicionar um componente de upload de imagem para "Logo do Cliente" com preview circular (similar ao padrao de avatar do projeto).
- Upload para o bucket `proposal-moodboard` (reutilizar o mesmo bucket).

### 4. Hook: Atualizar `useProposals` para enviar `client_logo`

**`src/features/proposals/hooks/useProposals.ts`:**
- Na mutation `createProposal`, fazer upload do `client_logo_file` para o Storage e incluir a URL no insert.

### 5. Reestruturar `Proposals.tsx` (Home dos Orcamentos)

Seguir exatamente o padrao de `Projects.tsx`:

- Remover os botoes de filtro de status.
- Buscar TODOS os orcamentos (sem filtro de status).
- Separar em 3 secoes:

  **Secao 1: "Orcamentos Ativos" (visivel)**
  - Status `draft` e `sent` (propostas ativas, em andamento).
  - Icone: `Clock` com fundo `bg-primary/10`.
  - Card aberto por padrao.

  **Secao 2: "Aprovados" (oculta, Collapsible)**
  - Status `approved`.
  - Icone: `CheckCircle` com fundo `bg-success/10`.
  - Collapsible, fechado por padrao.

  **Secao 3: "Arquivados" (oculta, Collapsible)**
  - Status `expired` (expirados sao tratados como arquivados).
  - Icone: `Archive` com fundo `bg-muted`.
  - Collapsible, fechado por padrao.

  Cada secao renderiza dentro de `<Card>` com `<CardHeader>` contendo icone + titulo + contagem, e `<CardContent>` com grid responsivo `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`.

### 6. Redesenhar `ProposalCard` seguindo `ProjectSummaryCard`

**Novo layout do card:**

```text
+------------------------------------------+
| [Logo]  Nome do Projeto        [...menu] |
|         Nome do Cliente                  |
|                                          |
| [Badge Status] [Badge Validade]          |
|                                          |
| 👤 Responsavel (cliente)                 |
| 💰 R$ 15.000,00                         |
| 📅 Validade: 25/03/2026                 |
|                                          |
| [ Copiar Link ]  [ Abrir ]              |
+------------------------------------------+
```

- **Logo do cliente** no canto superior esquerdo (circular, com fallback para icone `Building2`).
- **Dropdown menu** (3 pontos) com: "Ver Proposta", "Copiar Link", "Excluir".
- **Badges** de status e indicador de validade (dias restantes ou "Expirada").
- **Informacoes compactas** com icones: responsavel, valor final, data de validade.
- **Botao de acao** full-width no rodape: "Ver Proposta" com hover animado (igual ProjectSummaryCard).
- Border-left colorida por status: `border-l-primary` (draft/sent), `border-l-success` (approved), `border-l-destructive` (expired).

### Arquivos Alterados

| Arquivo | Alteracao |
|---|---|
| Migration SQL | Adicionar coluna `client_logo` |
| `src/features/proposals/types/index.ts` | Campos de logo |
| `src/features/proposals/hooks/useProposals.ts` | Upload de logo no create, remover filtro de status |
| `src/features/proposals/components/ProposalWizard.tsx` | Upload de logo no Step 1 |
| `src/features/proposals/components/ProposalCard.tsx` | Redesenho completo do card |
| `src/pages/Proposals.tsx` | Reestruturacao com secoes e Collapsible |

