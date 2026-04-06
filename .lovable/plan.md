

# Replace InlineSelectCell with DropdownMenu for status in PPTable

## Changes in `src/features/post-production/components/PPTable.tsx`

### 1. Add imports
- `DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger` from `@/components/ui/dropdown-menu`
- `ChevronDown, Check` from `lucide-react`
- `Badge` from `@/components/ui/badge`
- `PP_STATUS_COLUMNS` from `../types`

### 2. Add StatusDropdown component
Define a `StatusDropdown` component before `PPTable` that renders a `DropdownMenu` with `Badge` as trigger showing current status + chevron, and menu items for each status from `PP_STATUS_COLUMNS`. Includes auto-set logic for `delivered_date` and `start_date`.

### 3. Replace InlineSelectCell for status (lines 142-154)
Replace the `InlineSelectCell` block with `<StatusDropdown item={item} onUpdate={handleStatusChange} />` where `handleStatusChange` handles the date auto-sets and calls `updateItem.mutate`.

Note: `updateItem` is already available in the component (line 35). No new mutation hook needed.

