

# Reverter prioridade da API na edge function ai-proposal-assistant

## Problema
A última mudança inverteu a prioridade: Lovable Gateway virou principal e Anthropic virou fallback. Mas o Anthropic é necessário como principal porque é o único que suporta `web_search_20250305` para enriquecer dados do cliente.

## Mudança

**Arquivo:** `supabase/functions/ai-proposal-assistant/index.ts`

Alterar a lógica de `useAnthropic`:

```typescript
// DE (atual):
const useAnthropic = !!anthropicKey && !lovableKey;

// PARA:
const useAnthropic = !!anthropicKey;
```

Se `ANTHROPIC_API_KEY` existe, usa Anthropic. Lovable Gateway só é usado se a key não existir.

Uma única linha alterada. Nenhum outro arquivo modificado.

