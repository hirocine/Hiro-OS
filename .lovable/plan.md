

# Swap date fields order + rename label + fix Popover modal

## File: `src/features/post-production/components/PPDialog.tsx`

### Change (lines 254-327)
Replace the date fields grid with the Início block first (left), then the Prazo block second (right) renamed to "Data de Entrega". Add `modal={false}` to both `<Popover>` components.

Specifically:
1. **Line 254-291** (currently Prazo first) and **lines 292-327** (currently Início second) — swap their positions
2. **Line 256** — rename `Prazo` label to `Data de Entrega`
3. **Lines 257, 294** — add `modal={false}` to both `<Popover>` tags

No logic changes, no other files.

