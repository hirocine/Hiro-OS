

# Ajuste da regra de múltiplos projetos no prompt de analyze_transcript

## Alteração

**Arquivo:** `supabase/functions/ai-proposal-assistant/index.ts` — Linha 296

Substituir a regra atual:
```
- Se identificar MAIS DE UM projeto ou escopo distinto, pergunte qual incluir na proposta. Sempre inclua a opção "Juntar todos em 1 proposta".
```

Pela regra expandida:
```
- Se identificar MAIS DE UM projeto ou escopo distinto, liste CADA projeto como uma opção individual para o usuário escolher qual incluir na proposta. Cada opção deve ter o nome do projeto e uma descrição breve do escopo. Sempre inclua como última opção "Juntar todos em 1 proposta". Exemplo: se a transcrição menciona webcasts, EAD e vídeo institucional, as opções devem ser: opção A = Webcasts (com descrição), opção B = EAD (com descrição), opção C = Vídeo institucional (com descrição), opção D = Juntar todos em 1 proposta.
```

Nenhum outro arquivo será alterado. Edge function será redeployada automaticamente.

