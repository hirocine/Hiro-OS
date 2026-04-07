

# Redesign PPTable: remove column, merge info, restyle

## File: `src/features/post-production/components/PPTable.tsx`

### 1. Remove "Projeto / Cliente" column
- Delete the `<TableHead>` for `project_name` (line 146-148)
- Delete the `<TableCell>` for project/client (lines 183-186)
- Update empty state `colSpan` from 6 to 5

### 2. Merge project/client info into Title cell
Replace the Title `<TableCell>` with a two-line structure showing title on top and client/project below in muted text.

### 3. Update column widths
- Titulo: `w-[35%]`
- Editor: `w-[15%]`
- Pipeline: `w-[22%]` (keep `min-w-[160px]`)
- Prioridade: `w-[13%]`
- Prazo: `w-[15%]`

### 4. Wrap Table in styled container
```tsx
<div className="rounded-xl overflow-hidden border-x-0 border border-border/40">
  <Table className="table-fixed">
```

### 5. Restyle rows and headers
- Data rows: `className="hover:bg-muted/40 cursor-pointer border-b border-border/40 last:border-0 transition-colors"`
- Header `<TableRow>`: `className="bg-muted/60 border-b border-border"`
- Each `<TableHead>`: `className="py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider"` plus width classes

Single file change, no other files.

