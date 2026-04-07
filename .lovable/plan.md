

# Replace PipelineProgress with CSS Grid layout

## File: `src/features/post-production/components/PPTable.tsx`

Replace the `PipelineProgress` component (the flex-based segment layout) with a grid-based version using `gridTemplateColumns: repeat(6, 1fr)` to guarantee equal-width segments regardless of container size. The status label and color logic remain identical.

