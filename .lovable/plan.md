

# Fix vertical alignment in ProposalDetails section headers

## Single file: `src/pages/ProposalDetails.tsx`

### Change
Replace all 8 `<CardHeader className="pb-3 border-b border-border">` wrappers with a flat `<div className="flex items-center justify-between p-6 pb-3 border-b border-border">`, removing the nested inner `<div className="flex items-center justify-between">`.

This eliminates the `flex flex-col space-y-1.5` default from `CardHeader` that breaks the single-row layout.

### Pattern

**Before** (current, all 8 sections):
```tsx
<CardHeader className="pb-3 border-b border-border">
  <div className="flex items-center justify-between">
    ...content...
  </div>
</CardHeader>
```

**After**:
```tsx
<div className="flex items-center justify-between p-6 pb-3 border-b border-border">
  ...content...
</div>
```

### Sections affected (8 total)
1. **Cliente e Projeto** — line 697
2. **Investimento** — line 766
3. **Objetivo** — line 804
4. **Dores do Cliente** — line 824
5. **Cases / Portfólio** — line 1012
6. **Entregas (Output)** — line 1204
7. **Serviços Inclusos** — line 1277
8. **Depoimento** — line 1350

### Import cleanup
Line 3: remove `CardHeader` from the import:
```tsx
import { Card, CardContent, CardTitle } from '@/components/ui/card';
```

No logic, state, buttons, or content changes — only wrapper structure.

