

# Split PPTable into Active + Delivered Accordion

## File: `src/features/post-production/components/PPTable.tsx`

### Change 1: Add `ChevronDown` to imports (line 4)
Add `ChevronDown` to the lucide-react import. Add `cn` import from `@/lib/utils`.

### Change 2: Split items + accordion state (after line 125)
Add `activeItems` (non-entregue), `deliveredItems` (entregue, sorted by `delivered_date || updated_at` descending), and `deliveredOpen` state.

### Change 3: Main table uses `activeItems` (line 163)
Replace `sortedItems.map(...)` with `activeItems.map(...)`. Update empty state check to `activeItems.length === 0` with message "Nenhum vídeo em produção.".

### Change 4: Delivered accordion (after line 241)
Add collapsible section with header button (ChevronDown + "Entregues" + count badge + "Ordenado por mais recente") and table body when open.

**Note on `vimeo_url`**: The `PostProductionItem` type does not have a `vimeo_url` property. The "Link" column in the delivered table will be simplified to show `delivered_date` only, and the Link column will be omitted. Alternatively, I can add just 4 columns (Título, Editor, Pipeline, Entregue em) without the Link column, which matches the available data.

### Delivered table columns (4 columns instead of 5)
- Título (35%) — same as main table
- Editor (15%) — InlineAssigneeCell
- Pipeline (22%) — PipelineProgress
- Entregue em (28%) — formatted `delivered_date`

No other files changed.

