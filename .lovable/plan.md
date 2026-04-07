

# Remove last:border-0 from PPTable data rows

## File: `src/features/post-production/components/PPTable.tsx`

Remove `last:border-0` from the data `<TableRow>` className so the bottom border applies to all rows including the last one.

**Before:** `"border-b border-border/50 last:border-0 hover:bg-muted/40 cursor-pointer transition-colors"`
**After:** `"border-b border-border/50 hover:bg-muted/40 cursor-pointer transition-colors"`

Single class change, no other files.

