

# Fluxo conversacional de IA — analyze + finalize + sub-step de perguntas

## Resumo

Adicionar `analyze_transcript` e `finalize_transcript` na edge function, expandir o hook, e tratar as perguntas como sub-step do Step 0 (sem alterar o array STEPS).

## Correção do build error existente

Em `ProposalGuidedWizard.tsx` linha 131, `suggestPainPoints` retorna `DiagnosticoDor[]` diretamente. Corrigir:
```
// Antes
if (result?.diagnostico_dores?.length) { setDores(result.diagnostico_dores); ... }
// Depois
if (result?.length) { setDores(result); ... }
```

## 1. Edge Function — `supabase/functions/ai-proposal-assistant/index.ts`

Adicionar dois blocos `else if` antes do bloco `else` final (linha 281):

**`analyze_transcript`**: Recebe `transcript`. Prompt pede JSON com `{ confirmed: { client_name, project_name, contacts[], summary }, questions: [{ id, emoji, text, type, options: [{ id, label, description? }] }] }`. Usa Anthropic SEM web search (`tools: []`). Fallback Lovable gateway. Parse JSON com fallback regex.

**`finalize_transcript`**: Recebe `transcript` + `answers` (Record). Formata answers como texto legível no prompt. Retorna JSON com `client_name, project_name, client_responsible, objetivo, diagnostico_dores[], entregaveis[]`. Anthropic SEM web search. Fallback gateway.

Prompts exatos conforme especificado pelo usuário.

## 2. Hook — `src/features/proposals/hooks/useProposalAI.ts`

Adicionar types:
- `AnalyzeQuestion` — `{ id, emoji, text, type: 'single_select', options: Array<{ id, label, description? }> }`
- `AnalyzeResult` — `{ confirmed: { client_name, project_name, contacts, summary }, questions: AnalyzeQuestion[] }`

Adicionar states: `isAnalyzing`, `isFinalizing`

Adicionar métodos:
- `analyzeTranscript(transcript)` → chama action `analyze_transcript`, retorna `AnalyzeResult`
- `finalizeTranscript(transcript, answers)` → chama action `finalize_transcript`, retorna `TranscriptResult`

Exportar tudo.

## 3. Wizard — `src/features/proposals/components/ProposalGuidedWizard.tsx`

**STEPS permanece inalterado** — sem inserir step de perguntas no array.

**Novo estado**:
- `analyzeResult: AnalyzeResult | null`
- `answers: Record<string, string>`
- `showQuestions: boolean` — controla se exibe as perguntas dentro do step 0

**Step 0 — Briefing**: `handleAnalyzeBriefing` troca `parseTranscript` por `analyzeTranscript`:
- Se `questions.length === 0`: chama `finalizeTranscript(transcript, {})` + `enrichClient(confirmed.client_name)`, preenche campos, vai para step 1
- Se `questions.length > 0`: salva `analyzeResult`, seta `showQuestions = true` (continua em step 0)

**Sub-tela de perguntas (dentro de step === 0)**:
- Quando `showQuestions && analyzeResult`: renderiza os cards de perguntas em vez do textarea
- Mostra `analyzeResult.confirmed.summary` como contexto no topo
- Cada pergunta: card com emoji grande, texto semibold, opções como botões outline empilhados
- Opção selecionada: borda primary + `bg-primary/5`
- Descrição da opção em texto menor
- Fade-in sequencial (style `animationDelay: ${i * 200}ms`)
- Botão "Continuar" desabilitado até todas respondidas
- Botão "← Voltar ao briefing" que reseta `showQuestions`
- Ao continuar: chama `finalizeTranscript(transcript, answers)` + `enrichClient`, preenche campos, vai para step 1

**Loading messages**: Dois conjuntos — análise ("Lendo o briefing...", "Identificando o cliente...", "Analisando o escopo...") e finalização ("Preparando os campos...", "Buscando dados da empresa...", "Quase pronto...")

**Stepper** continua com `{step > 0 && ...}` — não exibe durante step 0 (incluindo sub-tela de perguntas), mantendo a UX limpa.

## Arquivos alterados

1. `supabase/functions/ai-proposal-assistant/index.ts` — 2 actions novas
2. `src/features/proposals/hooks/useProposalAI.ts` — 2 métodos + types
3. `src/features/proposals/components/ProposalGuidedWizard.tsx` — sub-step + fix build error

Nenhum arquivo em `src/features/proposals/components/public/` será alterado.

