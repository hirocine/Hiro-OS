

# Replace date pickers with native date inputs in PPDialog

## File: `src/features/post-production/components/PPDialog.tsx`

### Change 1: Remove imports (lines 8-13)
Remove lines 8-9 (Calendar, Popover imports), remove `CalendarIcon` from line 10, remove lines 11-12 (`format`, `ptBR`), remove line 13 (`cn`). Keep `X` in lucide-react import.

**Note**: `format` and `cn` are still used elsewhere in the file (in `handleSave` for `delivered_date` formatting). Need to check — actually `format` is used in `onSelect` callbacks which are being removed, and `delivered_date` uses `new Date().toISOString().split('T')[0]` not `format`. And `cn` is used in Calendar className which is being removed. Let me verify other usages.

Actually, `format` from date-fns and `ptBR` are only used in the date field rendering (lines 270, 279, 307, 316). `cn` is used in lines 264, 282, 300, 319 — all inside the date blocks being removed. `CalendarIcon` only in lines 268, 305. So all can be safely removed.

Keep: `X` from lucide-react (used in line 21 via Trash2... actually let me check if X is used elsewhere). X is only used in the "Limpar" buttons being removed. So `X` can also be removed from the import. `Trash2` is imported separately on line 21.

### Change 2: Remove state variables (lines 78-79)
Remove `startDateOpen` and `dueDateOpen` state declarations.

### Change 3: Replace date fields block (lines 256-331)
Replace entire grid with native date inputs using `<Input type="date">`.

### Summary of import changes
- Remove line 8: `Calendar` import
- Remove line 9: `Popover, PopoverContent, PopoverTrigger` import  
- Line 10: remove `CalendarIcon, X` — line becomes empty, remove it
- Remove line 11: `format` from date-fns
- Remove line 12: `ptBR` from date-fns/locale
- Remove line 13: `cn` from utils

No other files changed.

