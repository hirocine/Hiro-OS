

# Replace inline empty states in PPTable, RecentActivityWidget, TasksTable

## File: `src/features/post-production/components/PPTable.tsx`

### 1. Add imports
- Add `Film` to lucide-react imports (if not present)
- Add `import { EmptyState } from '@/components/ui/empty-state';`

### 2. Replacement (lines 184-188)
Replace the `<TableRow>` containing "Nenhum vídeo na esteira" with:
```tsx
<TableRow>
  <TableCell colSpan={7}>
    <EmptyState icon={Film} title="" description="Nenhum vídeo na esteira ainda." compact />
  </TableCell>
</TableRow>
```

---

## File: `src/features/tasks/components/RecentActivityWidget.tsx`

### 1. Add imports
- `Activity` should already be imported; verify
- Add `import { EmptyState } from '@/components/ui/empty-state';`

### 2. Replacement (lines 52-54)
Replace the `<p>` with:
```tsx
<EmptyState icon={Activity} title="" description="Nenhuma atividade recente." compact />
```

---

## File: `src/features/tasks/components/TasksTable.tsx`

### 1. Add imports
- Add `CheckSquare` to lucide-react imports
- Add `import { EmptyState } from '@/components/ui/empty-state';`

### 2. Replacement (lines 301-305)
Replace the `<TableRow>` with:
```tsx
<TableRow>
  <TableCell colSpan={showAssignee ? 6 : 5}>
    <EmptyState icon={CheckSquare} title="" description="Nenhuma tarefa encontrada." compact />
  </TableCell>
</TableRow>
```

No other changes.

