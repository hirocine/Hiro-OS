

# Refatorar Formulário de Proposta Comercial

## Resumo

Reestruturar completamente o `ProposalWizard` em 6 etapas claras que espelham as seções da proposta pública, com dados pré-preenchidos, bancos de opções reutilizáveis, e lógica de cálculo automático.

---

## Etapa 1 — Nova tabela: Banco de Cases (`proposal_cases`)

Criar tabela para armazenar cases reutilizáveis entre propostas:

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | |
| `tipo` | text | Tipo de projeto (Campanha Publicitária, Institucional, etc.) |
| `client_name` | text | Nome do cliente do case |
| `campaign_name` | text | Nome da campanha/projeto |
| `vimeo_id` | text | ID do vídeo Vimeo |
| `vimeo_hash` | text | Hash de privacidade Vimeo |
| `destaque` | boolean | Se é item destaque (showreel) |
| `created_by` | uuid | Quem criou |
| `created_at` | timestamptz | |

Adicionar coluna `sent_date` (date, nullable) na tabela `orcamentos` para "Data de Envio".

RLS: acesso autenticado para select/insert/update/delete.

---

## Etapa 2 — Nova tabela: Banco de Dores (`proposal_pain_points`)

Criar tabela para armazenar dores pré-prontas reutilizáveis:

| Coluna | Tipo |
|---|---|
| `id` | uuid PK |
| `label` | text (ex: "Prioridade") |
| `title` | text (ex: "Qualidade visual premium") |
| `description` | text |
| `created_by` | uuid |
| `created_at` | timestamptz |

Seed com 6-8 dores padrão (qualidade visual, prazo, multiplataforma, posicionamento, ROI, etc.).

---

## Etapa 3 — Reestruturar tipos (`types/index.ts`)

Atualizar `ProposalFormData`:
- Adicionar `sent_date: Date` (pré-preenchido com hoje)
- Remover `whatsapp_number` do step de cliente (mover para step de investimento ou manter global)
- Alterar `entregaveis` para estrutura tipada com `{ titulo: string, descricao: string, quantidade: string, icone: string }`
- Adicionar `incluso_items` como JSONB — a estrutura de checklist com categorias (Pré-produção, Gravação>Equipe, Gravação>Equipamentos, Gravação>Produção, Pós-produção) e cada item com `{ nome, ativo, quantidade? }`
- `cases` passa a ser `string[]` (array de IDs do banco de cases selecionados)

Nova interface `EntregavelItem`:
```typescript
interface EntregavelItem {
  titulo: string;
  descricao: string;
  quantidade: string;
  icone: string;
}
```

---

## Etapa 4 — Reestruturar o Wizard em 6 steps

### Step 0 — Cliente e Projeto
```
[Nome do Cliente *]        [Nome do Projeto *]
[Responsável]              [WhatsApp]
[Data de Envio (hoje)]     [Data de Validade *]
```
- Data de Envio pré-preenchida com hoje, editável
- Validade selecionável via calendar

### Step 1 — Diagnóstico (Sobre)
- **Diagnóstico**: Textarea com texto-exemplo completo (o template que o usuário forneceu com `{empresa}` placeholder)
- **Dores do Cliente**: Lista de dores pré-prontas carregadas do banco `proposal_pain_points`, com checkbox para selecionar (máximo 3). Botão "Adicionar personalizada" que abre inline com campos label/título/descrição e botão checkmark para confirmar. Salva no banco para reutilização futura.

### Step 2 — Portfólio (Cases)
- Lista de cases do banco `proposal_cases` com checkbox para selecionar quais incluir na proposta
- Cada card mostra: Tipo de projeto, Nome do cliente, Nome da campanha
- Botão "Adicionar novo case" com campos: tipo, client_name, campaign_name, vimeoId, vimeoHash, destaque — salva no banco para reutilização
- Switch de destaque (showreel)

### Step 3 — Entregáveis
- Lista dinâmica de entregáveis, cada um com:
  1. Título (ex: "Vídeo principal")
  2. Descrição (ex: "Peça hero com até 60 segundos")
  3. Quantidade (ex: "1", "3-5", "12")
  4. Ícone: Select com opções de ícones Lucide (Video, Smartphone, Camera, ClipboardList, Clapperboard, Palette, Image, Music, Monitor, etc.)

### Step 4 — O que está incluso
- Todas as opções de serviço organizadas por categoria (hardcoded, mesmo do GitHub):
  - **Pré-produção**: Roteiro, Storyboard, Cenário
  - **Gravação > Equipe**: Diretor, Filmmaker, Fotógrafo, Making Of, Produtor, Operador de Som, Operador de TP, Make e Cabeleireiro, Figurino
  - **Gravação > Equipamentos**: Câmeras (com campo de quantidade), Iluminação, Áudio, Drone, Teleprompter
  - **Gravação > Produção**: Estúdio, Catering, Gerador
  - **Pós-produção**: Edição, Motion Graphics, VFX, Color Grading, Trilha de Banco, Banco de Imagens, Geração de Cenas com AI
- Cada item tem toggle (checkbox/switch) para marcar como INCLUSO ou ADD-ON
- Câmeras tem campo de quantidade quando ativo
- Botão "Adicionar personalizado" em cada categoria
- Visual igual à imagem de referência (3 cards por categoria)

### Step 5 — Investimento
- **Valor do projeto**: Input para `base_value` (valor cheio, ex: 20.000)
- **Desconto (%)**: Input para `discount_pct` (ex: 50%)
- **Preview automático**: Mostra valor de tabela riscado → desconto badge → valor final calculado
- **Opções de pagamento**: Fixas (Opção 1: À Vista com 5% off, Opção 2: 2x recomendado) — sem edição
- **Depoimento**: Fixo padrão (Thiago Nigro) — sem edição por enquanto
- **Condições gerais**: Texto fixo padrão

---

## Etapa 5 — Atualizar `useProposals.ts`

- Ao criar proposta, buscar os cases selecionados do banco `proposal_cases` por ID e montar o JSONB completo
- Montar o JSONB de `entregaveis` no formato que o `ProposalEntregaveis.tsx` espera (com os dois blocos: Output + Serviços/checklist)
- Salvar `sent_date` no banco
- Opções de pagamento e depoimento hardcoded no insert (não vêm do form)

---

## Etapa 6 — Adicionar coluna `sent_date` e `incluso_items` no banco

- `sent_date` (date, nullable) na tabela `orcamentos`
- `incluso_items` (jsonb, nullable) — armazena o estado do checklist de serviços inclusos

Ou alternativamente, montar o JSONB final de `entregaveis` no hook combinando entregáveis + incluso em tempo de submit, sem coluna extra.

---

## O que NÃO muda

- **Nenhuma alteração na página pública** — o design do `/orcamento/:slug` permanece pixel-perfect com o GitHub
- O `ProposalPublicPage.tsx` e todos os componentes `public/` ficam intocados
- O `ProposalHero` já usa `createdAt` como "Data de Envio", então o campo `sent_date` alimenta isso

---

## Arquivos alterados

| Arquivo | Ação |
|---|---|
| `supabase/migrations/` | 2 novas migrations (tabelas + seed + coluna sent_date) |
| `src/features/proposals/types/index.ts` | Novos tipos e form data |
| `src/features/proposals/components/ProposalWizard.tsx` | Reescrita completa (6 steps) |
| `src/features/proposals/hooks/useProposals.ts` | Lógica de submit refatorada |
| `src/features/proposals/hooks/usePainPoints.ts` | Novo hook para banco de dores |
| `src/features/proposals/hooks/useProposalCases.ts` | Novo hook para banco de cases |
| `src/integrations/supabase/types.ts` | Auto-gerado |

