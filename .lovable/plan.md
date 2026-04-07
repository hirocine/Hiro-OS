

# Fix PPTable pipeline segments and verify stats-card

## File 1: `src/features/post-production/components/PPTable.tsx`
- Line 37: Replace `"flex items-center gap-[3px] w-full"` with `"flex items-center gap-[3px]"` plus `style={{ width: '100%', minWidth: 0 }}`
- Line 41: Add `min-w-0` to each segment: `h-[3px] flex-1 min-w-0 rounded-full transition-colors`

## File 2: `src/components/ui/stats-card.tsx`
Already correct — `bgColor` is already the last class on line 19. No change needed.

