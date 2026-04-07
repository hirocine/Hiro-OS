

# Fix PPTable border styling

## File: `src/features/post-production/components/PPTable.tsx`

Three class changes:

1. **Wrapper div**: `border-x-0 border border-border/40` → `border-y border-border/50`
2. **Header `<TableRow>`**: `bg-muted/60 border-b border-border` → `bg-muted border-b border-border`
3. **Data `<TableRow>`**: `hover:bg-muted/40 cursor-pointer border-b border-border/40 last:border-0 transition-colors` → `border-b border-border/50 last:border-0 hover:bg-muted/40 cursor-pointer transition-colors`

No other files.

