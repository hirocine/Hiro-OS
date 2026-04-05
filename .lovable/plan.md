

# Fix project_number saving and add uniqueness validation

## File 1: `src/features/proposals/hooks/useProposals.ts`

**Line 205**: Remove the toast from `updateProposal.onSuccess` — the calling code already shows its own feedback.

```ts
// Before
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['proposals'] });
  toast.success('Proposta atualizada com sucesso!');
},

// After
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['proposals'] });
},
```

## File 2: `src/pages/ProposalDetails.tsx`

### Change 1: Add uniqueness check (after line 376, before the closing `}` of the client validation block)

Insert a new block that queries Supabase for any other proposal with the same `project_number`. If found, show a descriptive error toast and set the field error state, then return early.

### Change 2: maxLength update (line 738)

Change `maxLength={3}` to `maxLength={4}` on the project_number Input.

No other changes.

