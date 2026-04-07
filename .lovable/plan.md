

# Rewrite PPTable JSX layout

## Single file: `src/features/post-production/components/PPTable.tsx`

### Import changes
- Add `AlertTriangle` to lucide-react imports, remove `Pencil`
- Add `import { format } from 'date-fns'`
- Remove `Button` import (no longer needed — pencil column removed)

### Replace PipelineProgress (lines 59-77)
New version includes a status label above the progress bar, uses `flex-1` equal-width segments with `bg-primary` for completed, `bg-primary/40` for current, `bg-border` for future.

### Replace TableHeader (lines 158-180)
- 6 columns instead of 7 (remove empty pencil column)
- New widths: 22%, 16%, 12%, 20%, 12%, 18%
- "Pipeline" label instead of "Etapa"
- Remove `style={{ textAlign: 'left' }}`

### Replace TableBody rows (lines 182-237)
- Row-level `onClick` navigates to detail page, `cursor-pointer` on the row
- Title cell: simple span, no PipelineProgress here
- Project/Client cell: shows `client_name · project_name` joined
- Editor cell: `e.stopPropagation()` on cell
- Pipeline cell: `<PipelineProgress>` with status label + bar
- Priority cell: `e.stopPropagation()` on cell
- Due date cell: overdue logic — if overdue and not `entregue`, show red `AlertTriangle` + formatted date + "Atrasada há X dias"; otherwise normal `InlineDateCell` with `e.stopPropagation()`
- Remove pencil button column entirely

### Empty state (line 242)
- `colSpan={6}` instead of `colSpan={7}`

### Removals
- `StatusDropdown` component (lines 31-55) — no longer used
- Remove unused imports: `ChevronDown`, `Check`, `Badge`, `DropdownMenu*`, `PPStatusBadge`, `PP_STATUS_COLUMNS`

