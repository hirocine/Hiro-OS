

# Fix handleAdvanceStage + add handleGoBack + redesign footer buttons

## File: `src/features/post-production/components/PPVideoPage.tsx`

### Change 1: Move `normalizedStatus` before handlers (lines 160-163 → before line 118)
Move the normalization block to right after line 111 (before `handleDelete`), so handlers can use it.

### Change 2: Fix `handleAdvanceStage` (lines 129-145)
Replace `form.status` with `normalizedStatus` in the findIndex call.

### Change 3: Add `handleGoBack` (after handleAdvanceStage, ~line 145)
New handler that finds the previous macro step using `normalizedStatus`, updates form + DB, and toasts.

### Change 4: Replace sub-steps footer (lines 415-430)
Replace with new layout: left counter, right side has "← Voltar" ghost button (if not first step) + either "Próxima sub-etapa →" outline button (if sub-steps remain) or "Avançar para {next} →" default button (if all sub-steps done and next exists).

### Change 5: Replace standalone advance block (lines 434-441)
Replace with version that includes both back button and advance button, wrapped in `justify-end gap-2`.

No other files.

