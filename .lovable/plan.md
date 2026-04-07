

# Uniform-height pipeline segments with opacity differentiation

## File: `src/features/post-production/components/PPTable.tsx`

In the `PipelineProgress` component, replace the `<rect>` element so all segments share the same `y={0}`, `height={4}`, and `fill="currentColor"`. Differentiation is purely via className:

- Completed: `text-primary` (full opacity)
- Active: `text-primary opacity-50`
- Future: `text-muted-foreground opacity-20`

Single element change within the SVG map callback. No other files.

