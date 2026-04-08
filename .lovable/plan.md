

# Restore Popover/Calendar date pickers with z-[200] fix in PPDialog

## File: `src/features/post-production/components/PPDialog.tsx`

### Change 1: Add imports (after line 15)
Add `format` from date-fns, `ptBR` from date-fns/locale, `Calendar`, `Popover/PopoverContent/PopoverTrigger`, and `CalendarIcon, X` from lucide-react.

### Change 2: Add state variables (after line 72)
Add `startDateOpen` and `dueDateOpen` controlled state.

### Change 3: Replace date fields grid (lines 249-282)
Replace native `<input type="date">` with controlled `<Popover modal={false}>` + `<Calendar>` for both fields. Key details:
- Início (left), Data de Entrega (right)
- `<PopoverContent className="w-auto p-0 z-[200]" align="start" onCloseAutoFocus={e => e.preventDefault()}>`
- Calendar with `mode="single"`, `initialFocus`, `className="p-3 pointer-events-auto"`
- `onSelect` sets form value + closes popover
- Conditional "Limpar" button when date is set
- Trigger shows formatted date (`dd/MM/yyyy` with ptBR locale) or placeholder

### Change 4: Update DialogContent (line 150)
Change `<DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">` to add `overflow-visible` instead of `overflow-y-auto` — actually no, keep `overflow-y-auto` but the z-[200] on PopoverContent will render via portal above the dialog anyway.

No other files changed.

