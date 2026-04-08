

# Auto-regenerate slug on updateProposal

## File: `src/features/proposals/hooks/useProposals.ts`

### Change: Expand `updateProposal.mutationFn` (lines 196-201)

Before the `supabase.update()` call, add slug regeneration logic:

```typescript
mutationFn: async ({ id, data }: { id: string; data: Partial<Record<string, any>> }) => {
  // If client_name or project_name changed, regenerate slug
  if (data.client_name || data.project_name) {
    const { data: current } = await supabase
      .from('orcamentos')
      .select('client_name, project_name')
      .eq('id', id)
      .single();

    const clientName = (data.client_name as string) || current?.client_name || '';
    const projectName = (data.project_name as string) || current?.project_name || '';

    let newSlug = generateSlug(clientName, projectName);

    // Check uniqueness (exclude current record)
    const { data: existing } = await supabase
      .from('orcamentos')
      .select('slug')
      .eq('slug', newSlug)
      .neq('id', id)
      .maybeSingle();

    if (existing) {
      newSlug = `${newSlug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    data.slug = newSlug;
  }

  const { error } = await supabase
    .from('orcamentos')
    .update(data as any)
    .eq('id', id);
  if (error) throw error;
},
```

Also invalidate `proposal-details` queries in `onSuccess` so detail pages refresh with new slug.

No other files modified. No changes to `src/features/proposals/components/public/`.

