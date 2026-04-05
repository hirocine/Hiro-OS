

# Replace inline empty states in ProjectDetails, CompanyDetails, SupplierDetails

## File: `src/pages/ProjectDetails.tsx`

### 1. Add imports
- Add `History, FileText` to lucide-react import (line 11)
- Add `import { EmptyState } from '@/components/ui/empty-state';`

### 2. Replacements

**Lines 767-770** — "Nenhum histórico disponível" block with Clock icon:
Replace entire `<div>` with:
```tsx
<EmptyState icon={History} title="Nenhum histórico" description="Nenhum histórico disponível." compact />
```

**Lines 828-830** — "Nenhuma observação adicionada":
Replace entire `<div>` with:
```tsx
<EmptyState icon={FileText} title="Nenhuma observação" description="Nenhuma observação adicionada." compact />
```

---

## File: `src/pages/CompanyDetails.tsx`

### 1. Add imports
- Add `FileText` to lucide-react import (line 3)
- Add `import { EmptyState } from '@/components/ui/empty-state';`

### 2. Replacement

**Lines 253-255** — "Nenhuma nota registrada":
Replace `<p>` with:
```tsx
<EmptyState icon={FileText} title="Nenhuma nota" description="Nenhuma nota registrada." compact />
```

---

## File: `src/pages/SupplierDetails.tsx`

### 1. Add imports
- Add `FileText` to lucide-react import (line 3)
- Add `import { EmptyState } from '@/components/ui/empty-state';`

### 2. Replacement

**Lines 274-276** — "Nenhuma nota registrada":
Replace `<p>` with:
```tsx
<EmptyState icon={FileText} title="Nenhuma nota" description="Nenhuma nota registrada." compact />
```

No other changes.

