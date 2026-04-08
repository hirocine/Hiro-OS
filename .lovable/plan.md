

# Update generateSlug to include project_number prefix and version suffix

## File: `src/features/proposals/hooks/useProposals.ts`

### 1. Rewrite `generateSlug` (lines 6-15)
New signature: `(clientName, projectName, projectNumber?, version?)`.
- Build parts from `[projectNumber, clientName, projectName]`, filter falsy, join with `-`
- Normalize, lowercase, strip non-alphanumeric
- Append `-v{version}` (default v1)

### 2. Update `createProposal` call (line 37)
```
generateSlug(form.client_name, form.project_name, form.project_number, 1)
```

### 3. Update `updateProposal` (lines 198-221)
- Expand condition: `if (data.client_name || data.project_name || data.project_number)`
- Expand select: `'client_name, project_name, project_number, version'`
- Call: `generateSlug(clientName, projectName, data.project_number as string || current?.project_number, current?.version)`

### 4. Update `createNewVersion` (line 300)
Replace manual slug construction with:
```
const newSlug = generateSlug(rest.client_name, rest.project_name, rest.project_number, nextVersion);
```

### 5. Update `duplicateProposal` (lines 340-355)
- Remove `copia` from slug generation, remove `(Cópia)` from project_name
- Call: `generateSlug(rest.client_name || '', rest.project_name || '', rest.project_number, 1)`
- Keep `project_name` as-is (no more "(Cópia)" suffix)

No other files modified. No changes to `src/features/proposals/components/public/`.

