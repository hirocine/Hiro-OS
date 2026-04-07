

# Update PipelineProgress for `entregue` status

## File: `src/features/post-production/components/PPTable.tsx`

### Change (lines 44-64)
Add `const isDelivered = status === 'entregue';` before the map, then update the `<rect>` className to check `isDelivered` first — if true, all segments render as `text-green-600 dark:text-green-400`. Otherwise, existing logic applies.

