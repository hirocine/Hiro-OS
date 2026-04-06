

# Add quick filter chips to Post-Production page

## Single file change: `src/pages/PostProduction.tsx`

### 1. Imports
- Add `useMemo` to the React import
- Add `PPPriority`, `PP_PRIORITY_CONFIG` from `@/features/post-production/types`

### 2. State
Add after existing `search` state:
- `filterEditor: string | null` (default `null`)
- `filterPriority: PPPriority | null` (default `null`)

### 3. Derived data
- Compute `editors` array via `useMemo` from unique `editor_name` values in `items`
- Update `filteredItems` to also check `filterEditor` and `filterPriority`

### 4. UI — Filter chips row
Insert between the search `<div>` and the `<Tabs>` component:
- A `flex flex-wrap gap-2 items-center` row containing:
  - Priority chips (urgente, alta, media, baixa) — toggle on/off, filled style when active
  - Separator dot when editors exist
  - Editor chips (first name only) — toggle on/off
  - "Limpar x" button when any filter is active
- Chip styles: `rounded-full border text-xs px-3 py-1.5`, active = `bg-foreground text-background`, inactive = `bg-background text-muted-foreground`

No other files changed.

