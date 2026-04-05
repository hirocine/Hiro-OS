

# Add "Enviar ao Cliente" button to ProposalOverview

## File: `src/pages/ProposalOverview.tsx`

### Verification
`useProposalDetailsById` returns `useQuery(...)` directly, so `refetch` is already available — no hook changes needed.

### Changes

1. **Line 5 — Add `Send` to lucide imports**

2. **Line 56 — Add `refetch` to destructure**: change to `const { data: proposal, isLoading, refetch } = useProposalDetailsById(id);`

3. **Before the return (~after `handleSetLatest`)** — Add handler:
```ts
const handleSendToClient = async () => {
  const today = new Date().toLocaleDateString('en-CA');
  const { error } = await supabase
    .from('orcamentos')
    .update({ status: 'sent', sent_date: today } as any)
    .eq('id', proposal.id);
  if (error) {
    toast.error('Erro ao enviar proposta');
  } else {
    toast.success('Proposta enviada ao cliente!');
    refetch();
  }
};
```

4. **Line 160 — Add button before "Copiar Link"**, only when draft:
```tsx
{proposal.status === 'draft' && (
  <Button size="sm" onClick={handleSendToClient}>
    <Send className="mr-1.5 h-4 w-4" /> Enviar ao Cliente
  </Button>
)}
```

No other changes.

