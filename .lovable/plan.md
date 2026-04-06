

# Fix AI assistant not showing all proposals

## Problem
The `search_proposals` tool correctly returns both proposals (sent + new_version), but the AI model's interpretation of "ativas" excludes "new_version" status because the prompt doesn't clarify that all `is_latest_version=true` proposals are current/relevant.

## Fix in `supabase/functions/ai-assistant/index.ts`

### 1. Update SYSTEM_PROMPT (line 10-31)
Add a section clarifying proposal statuses:

```
PROPOSTAS / ORÇAMENTOS:
- Todas as propostas retornadas pela ferramenta já são a versão mais recente (is_latest_version=true)
- Status "new_version" significa que esta proposta FOI CRIADA como nova versão de uma anterior — ela É a versão atual e deve ser considerada ativa
- Quando o usuário perguntar por propostas "ativas", inclua TODOS os status exceto "expired" (arquivada) e "draft" (rascunho), ou seja: sent, opened, approved, new_version
```

### 2. Redeploy the edge function

No other changes.

