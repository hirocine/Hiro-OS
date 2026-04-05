

# Improve Versions section UI in ProposalOverview

## File: `src/pages/ProposalOverview.tsx`

### 3 changes:

1. **Add `handleSetLatest` function** (before the `return`, ~line 95 area):
   - Accepts a `versionId`, sets all sibling versions to `is_latest_version: false`, then sets the target to `true`
   - Shows toast and navigates to the new version's overview

2. **Replace CardHeader with flat div** (lines 276-281):
   - Replace `<CardHeader>` + `<CardTitle>` with `<div className="flex items-center justify-between px-6 py-4 border-b border-border">` containing the title and count span directly

3. **Update version row actions** (lines 296-302):
   - If `isCurrent`: replace `(atual)` text with `<Badge variant="success">Atual</Badge>` on the right side
   - If `!isCurrent`: show two buttons — "Ver" (ghost, navigates to overview) and "Usar esta versão" (outline, calls `handleSetLatest`)

### Import cleanup
- `CardHeader` can be removed from import if no other section uses it (lines 198, 223, 276 use it — so keep it for now since sections 3 and 4 still use it)
- `toast` from sonner is already imported (line 4)

