

# Replace PipelineProgress with SVG-based segments

## File: `src/features/post-production/components/PPTable.tsx`

Replace the current CSS grid-based `PipelineProgress` component with an SVG version that uses fixed pixel-width rectangles (14px each, 3px gaps) for perfectly equal segments. Each segment has variable height for visual hierarchy: completed=3px, active=4px, future=2px. The status label above remains unchanged.

Single component replacement, no other changes.

