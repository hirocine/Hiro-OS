

# Padronização de layout do ProposalGuidedWizard.tsx

## Resumo
Reorganizar o layout do wizard para ter PageHeader fixo com subtítulo dinâmico, stepper sempre visível (exceto briefing sem perguntas), botões padronizados em todos os steps, e sub-step de perguntas alinhado à esquerda.

## Mudanças (arquivo único: ProposalGuidedWizard.tsx)

### 1. Mapa de subtítulos + PageHeader fixo no topo
Adicionar `stepSubtitles` logo antes do return (após `isLoadingAI`). No return, colocar `<PageHeader>` como primeiro filho, ANTES do stepper e dos blocos condicionais de step:

```tsx
const stepSubtitles: Record<number, string> = {
  0: showQuestions ? 'Algumas dúvidas sobre o briefing' : 'Cole o briefing e deixe a IA preencher',
  1: 'Dados do Projeto',
  2: 'Objetivo do Projeto',
  3: 'Dores do Cliente',
  4: 'Portfólio / Cases',
  5: 'Entregáveis',
  6: 'Serviços Inclusos',
  7: 'Depoimento',
  8: 'Investimento',
  9: 'Revisão Final',
};

// Primeiro elemento no return, antes do stepper:
{!generatedSlug && <PageHeader title="Nova Proposta" subtitle={stepSubtitles[step] || ''} />}
```

### 2. Remover títulos redundantes
- **Step 0 briefing** (L584-590): Remover o `<div className="space-y-1">` com `<h1>` e `<p>` (e o ícone Sparkles)
- **Step 0 perguntas** (L693-701): Remover o `<div className="text-center space-y-3">` com MessageSquare, `<h2>Algumas dúvidas</h2>` e `<p>summary</p>`
- **Step 1** (L773-780): Remover `<div className="space-y-1">` com `<h2>` e `<p>`
- **Step 2** (L858-865): Remover `<div className="space-y-1">` com `<h2>` e `<p>`
- **Step 3** (L890-891): Remover `<h2>` (manter o div que contém o botão "Sugerir com IA", mas sem o `<h2>` e `<p>`)
- **Step 4** (L988-991): Remover `<div className="space-y-1">` com `<h2>` e `<p>`
- **Step 5** (L1126-1133): Remover `<div className="space-y-1">` com `<h2>` e `<p>`
- **Step 6** (L1176-1178): Remover `<div className="space-y-1">` com `<h2>` e `<p>`
- **Step 7** (L1298-1301): Remover `<div className="space-y-1">` com `<h2>` e `<p>`
- **Step 8** (L1418-1421): Remover `<div className="space-y-1">` com `<h2>` e `<p>`
- **Step 9** (L1536-1539): Remover `<div className="space-y-1">` com `<h2>` e `<p>`

### 3. Stepper visibilidade expandida
Alterar condição do stepper (L553) de `{step > 0 &&` para `{(step > 0 || showQuestions) && !generatedSlug && (`

### 4. Sub-step de perguntas — alinhamento à esquerda + botões padronizados
- Alterar o container (L680): remover `items-center`, usar alinhamento à esquerda
- Mover o `summary` do `analyzeResultState.confirmed.summary` para um `<p>` simples alinhado à esquerda acima dos cards
- Substituir os botões atuais (L746-762 — link "Voltar ao briefing" + botão Continuar centralizados) por:
```tsx
<div className="flex justify-between pt-6">
  <Button variant="ghost" onClick={() => { setShowQuestions(false); setAnalyzeResultState(null); setAnswers({}); }}>
    <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
  </Button>
  <Button onClick={handleContinueFromQuestions} disabled={!allQuestionsAnswered}>
    Continuar <ArrowRight className="h-4 w-4 ml-1" />
  </Button>
</div>
```

### 5. Step 9 — botão "Criar Proposta"
O botão direito no Step 9 já diz "Criar Proposta" (L1651-1659). Manter como está.

### 6. Step 0 briefing — manter sem botões Voltar/Continuar
O Step 0 (sem perguntas) mantém o layout atual centralizado com "Analisar" como ação principal. Sem mudança aqui.

### Arquivos NÃO alterados
- Nenhum arquivo em `src/features/proposals/components/public/`
- Apenas `ProposalGuidedWizard.tsx` é modificado

