

# Replace Pipeline CardContent with new compact layout

## File: `src/features/post-production/components/PPVideoPage.tsx`

Replace lines 365-458 (the entire `<CardContent>...</CardContent>` block of the Pipeline card) with the new layout featuring:

1. **Thin progress track** — horizontal bar segments (`h-1.5`, `flex-1`, `rounded-full`) colored by step state
2. **Phase cards** — equal-width grid of clickable step buttons with number/checkmark, label, and state-based styling (`bg-primary/8` for active, `bg-muted/50` for done, transparent+opacity for future)
3. **Sub-steps row** — horizontal inline sub-step buttons with numbered circles, wrapped in a muted container; includes footer with counter + advance button
4. **Standalone advance button** — shown when current step has no sub-steps but a next step exists

No other files changed.

