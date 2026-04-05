

# Fix: Insert em proposal_views não registrando

## Diagnóstico
O código atual (linhas 38-49) faz o insert mas não verifica o `error` retornado pelo Supabase -- se falhar, segue silenciosamente. O insert pode estar falhando sem log.

## Mudança (arquivo único: `src/features/proposals/components/ProposalPublicPage.tsx`)

### Linhas 36-54: Reescrever trackView com error handling explícito

```tsx
const trackView = async () => {
  try {
    // 1. Insert view record
    const { data: viewData, error: viewError } = await supabase
      .from('proposal_views' as any)
      .insert({
        proposal_id: proposal.id,
        user_agent: navigator.userAgent,
        device_type: deviceType,
        referrer: document.referrer || null,
      } as any)
      .select('id')
      .single();

    if (viewError) {
      console.error('View insert error:', viewError);
    } else if (viewData) {
      viewIdRef.current = (viewData as any).id;
    }

    // 2. Increment count + update status
    await supabase.rpc('increment_proposal_views' as any, { proposal_id: proposal.id });
  } catch (err) {
    console.error('Track view error:', err);
  }
};
```

A mudança principal: capturar e logar `viewError` explicitamente, em vez de ignorá-lo. Isso vai mostrar no console se o insert está falhando e por quê (ex: RLS, schema mismatch, etc).

O resto do arquivo permanece inalterado.

