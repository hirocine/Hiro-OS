

# Variable-height pipeline segments

## File: `src/features/post-production/components/PPTable.tsx`

In the `PipelineProgress` component, move `h-[3px]` out of the shared className and make it conditional per segment state:

- Completed (`i < currentIndex`): `h-[3px] bg-primary`
- Current (`i === currentIndex`): `h-[4px] bg-primary/60`
- Future: `h-[2px] bg-muted-foreground/20`

Single file, single change.

