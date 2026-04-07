

# Two minor visual tweaks

## File 1: `src/components/ui/stats-card.tsx`
Move `{bgColor}` to end of className string on the icon wrapper div, and move the `<Icon>` element inside that same div with updated size `h-[18px] w-[18px]`. Remove the now-duplicate `<Icon>` line below.

## File 2: `src/features/post-production/components/PPTable.tsx`
In `PipelineProgress`, change the future-step segment color from `'bg-border'` to `'bg-muted-foreground/20'` for better visibility.

No logic changes. No other files.

