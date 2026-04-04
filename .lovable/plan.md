

# Integração IA no ProposalWizard com Anthropic API + Web Search

## Pré-requisito: adicionar secret

`ANTHROPIC_API_KEY` não está configurada nos secrets do projeto. Preciso adicioná-la antes de qualquer código funcionar.

## Arquivos a criar

### 1. `supabase/functions/ai-proposal-assistant/index.ts`

Edge function com 3 actions:

- **`enrich_client`**: Recebe `client_name`, usa Anthropic com `web_search` tool para buscar dados reais da empresa, retorna `company_description`.
- **`parse_transcript`**: Recebe `transcript`, extrai campos estruturados (client_name, project_name, client_responsible, objetivo, diagnostico_dores, entregaveis).
- **`suggest_pain_points`**: Recebe contexto do projeto, usa Anthropic com `web_search` tool para sugerir 3 dores relevantes.

Detalhes técnicos:
- Prioriza `ANTHROPIC_API_KEY` chamando `https://api.anthropic.com/v1/messages` com modelo `claude-sonnet-4-20250514`
- Nas actions `enrich_client` e `suggest_pain_points`, inclui `tools: [{ type: "web_search_20250305", name: "web_search" }]`
- Fallback para `LOVABLE_API_KEY` via Lovable AI Gateway (sem web search) caso Anthropic não esteja configurada
- System prompt completo com contexto da Hiro Films, posicionamento e faixas de preço
- CORS headers, validação de auth JWT, retorna JSON

### 2. `src/features/proposals/hooks/useProposalAI.ts`

Hook expondo:
- `enrichClient(clientName)` → retorna string
- `parseTranscript(transcript)` → retorna objeto com campos do form
- `suggestPainPoints(clientName, projectName, objetivo)` → retorna `DiagnosticoDor[]`
- Loading states: `isEnriching`, `isParsing`, `isSuggesting`

Usa `supabase.functions.invoke('ai-proposal-assistant', { body })`.

## Arquivo a modificar

### 3. `src/features/proposals/components/ProposalWizard.tsx`

**Step 0 (linha ~366)** — Após label "Descrição da Empresa":
- Botão `variant="outline" size="sm"` com ícone `Sparkles` + texto "Buscar com IA"
- Disabled quando `isEnriching` ou `!form.client_name`
- On click: chama `enrichClient(form.client_name)`, preenche `company_description`, toast de sucesso/erro

**Step 0 (linha ~375)** — Após o bloco de "Descrição da Empresa":
- Botão "Importar Transcrição" com ícone `Sparkles`
- Abre um Dialog com Textarea para colar transcrição
- On confirm: chama `parseTranscript`, preenche campos disponíveis, toast de sucesso/erro

**Step 1 (linha ~401)** — Ao lado de "Dores do Cliente":
- Botão "Sugerir com IA" com ícone `Sparkles`
- Disabled quando `isSuggesting`
- On click: chama `suggestPainPoints`, preenche `diagnostico_dores`, toast de sucesso/erro

Todos os botões mostram `Loader2 animate-spin` durante loading.

**Nenhum arquivo em `src/features/proposals/components/public/` será alterado.**

## Ordem de execução

1. Adicionar secret `ANTHROPIC_API_KEY`
2. Criar edge function
3. Criar hook
4. Modificar ProposalWizard
5. Deploy e testar edge function

