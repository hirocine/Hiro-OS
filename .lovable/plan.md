

# Update Pipeline CardContent styling classes

## File: `src/features/post-production/components/PPVideoPage.tsx`

### Change 1: Phase cards (lines 368-384)
- **Line 368-373**: Replace className with new styling — transparent bg for done, `bg-primary/10 border-primary shadow-sm` for active, transparent+opacity for future. Change `duration-200` to `duration-300`.
- **Lines 375-378**: Number/check span — change `text-[10px] font-medium` to `text-[11px] font-semibold`.
- **Lines 381-384**: Label span — add conditional `font-normal`/`font-semibold` instead of uniform `font-medium`.

### Change 2: Sub-step buttons (lines 400-421)
- **Lines 403-408**: Button className — add `px-2 py-1 rounded-md`, use opacity-based fading for done/future, `bg-primary/10` for active. Change `transition-colors` to `transition-all duration-200`.
- **Lines 410-414**: Circle className — muted bg for done, add `ring-3 ring-primary/25 scale-110` for active, `bg-border/60` for future. Add `duration-200`.
- **Line 418**: Label span — add `line-through` for done, `font-semibold` for active, `text-muted-foreground/60` for future. Add `transition-colors duration-200`.

Styling-only changes, no logic modifications, no other files.

