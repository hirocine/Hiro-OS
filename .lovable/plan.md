

# Fix PPTable pipeline overflow

## File: `src/features/post-production/components/PPTable.tsx`

### Change 1 — Pipeline TableCell (line 184)
Add `className="overflow-hidden"` to the `<TableCell>` wrapping `PipelineProgress`.

### Change 2 — PipelineProgress component (lines 33-37)
- Outer div: replace `w-full` with `min-w-0 max-w-full`; add `truncate` to the label span
- Grid div: replace `w-full` with `max-w-full`

No other files changed.

