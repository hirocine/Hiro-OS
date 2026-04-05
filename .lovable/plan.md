

# Improve Versions section in ProposalOverview

## File: `src/pages/ProposalOverview.tsx`

### 1. Add `handleSetLatest` function (before the `return`, after the existing `useEffect` blocks)

```ts
const handleSetLatest = async (versionId: string) => {
  const parentId = proposal.parent_id || proposal.id;
  await supabase.from('orcamentos').update({ is_latest_version: false } as any)
    .or(`id.eq.${parentId},parent_id.eq.${parentId}`);
  await supabase.from('orcamentos').update({ is_latest_version: true } as any)
    .eq('id', versionId);
  toast.success('Versão atualizada!');
  navigate(`/orcamentos/${versionId}/overview`);
};
```

Uses `proposal.parent_id || proposal.id` to find the root parent, then updates ALL siblings (including the root itself) via `.or(id.eq.${parentId},parent_id.eq.${parentId})` — same pattern as the existing `createNewVersion` mutation.

### 2. Replace `CardHeader` with flat div (lines 276-281)

Replace:
```tsx
<CardHeader className="pb-3 flex flex-row items-center justify-between">
  <CardTitle className="text-base flex items-center gap-2">
    <GitBranch className="h-4 w-4" /> Versões
  </CardTitle>
  <span className="text-xs text-muted-foreground">{versions.length} versões</span>
</CardHeader>
```

With:
```tsx
<div className="flex items-center justify-between px-6 py-4 border-b border-border">
  <h3 className="text-base font-semibold flex items-center gap-2">
    <GitBranch className="h-4 w-4" /> Versões
  </h3>
  <span className="text-xs text-muted-foreground">{versions.length} versões</span>
</div>
```

### 3. Update version row actions (lines 296-302)

- If `isCurrent`: replace `(atual)` text with `<Badge variant="success">Atual</Badge>` on the right side (remove from left)
- If `!isCurrent`: show two buttons — "Ver" (ghost) and "Usar esta versão" (outline, calls `handleSetLatest(v.id)`)

`toast` from sonner is already imported.

