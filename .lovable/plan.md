

# Redesign Pipeline: 5 Macro Steps + Sidebar Layout

## Summary
Remove Color Grading from macro steps (now a sub-step of Finalização), reduce pipeline from 6 to 5 steps, and replace the sub-steps layout with a horizontal steps + sidebar design. Changes span 3 files.

## File 1: `src/features/post-production/components/PPVideoPage.tsx`

### 1a. Replace MACRO_STEPS (lines 33-40)
Remove `color_grading` entry, keeping 5 steps: fila, edicao, finalizacao, revisao, entregue.

### 1b. Replace SUB_STEPS (lines 42-49)
Add "Color Grading" as first sub-step of `finalizacao`. Keep `color_grading` key with empty array for backward compatibility.

### 1c. Replace Pipeline CardContent (lines 364-473)
Replace the current vertical sub-steps and separate advance button with a two-column grid layout:
- **Left column**: horizontal macro steps (same circle+line style) plus advance button below a border-t
- **Right column**: sub-steps sidebar in a muted rounded card with small circle indicators (done/active/future), click-to-toggle, and progress counter

The advance button moves inside the left column area. The separate pipeline footer `div` (lines 462-473) is removed since the button is now inside CardContent.

## File 2: `src/features/post-production/components/PPTable.tsx`

### Replace PIPELINE_STEPS (line 26)
Change from 6 entries to 5: remove `color_grading`. The SVG width auto-adjusts since `totalW` is computed from `PIPELINE_STEPS.length`.

## File 3: `src/features/post-production/components/PPStatsCards.tsx`

No change needed. The `inProgress` filter already includes `color_grading` for backward compatibility with existing data.

## Technical Notes
- Items with `status: 'color_grading'` in the database will still render correctly in stats and table (they'll show between edicao and finalizacao in the pipeline bar since the index won't match, appearing as a "future" segment — acceptable for legacy data)
- The `PP_STATUS_CONFIG` and `PP_STATUS_ORDER` in types remain unchanged to avoid breaking existing data

