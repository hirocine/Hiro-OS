

# Auto-save fields, read-only Etapa, remove isDirty/handleSave, disable phase card clicks

## File: `src/features/post-production/components/PPVideoPage.tsx`

### 1. Remove `Save` from imports (line 6)
Remove `Save` from the lucide-react import.

### 2. Remove `isDirty` (lines 111-116) and `handleSave` (lines 123-143)
Delete both blocks entirely.

### 3. Replace Etapa Select with read-only display (lines 248-262)
Replace the Select-based Etapa field with:
```tsx
<div className="flex items-center gap-1.5">
  <span className="text-xs text-muted-foreground">Etapa</span>
  <PPStatusBadge status={form.status} />
</div>
```

### 4. Auto-save Prioridade (line 267)
Add `updateItem.mutate(...)` call after `setForm` in `onValueChange`.

### 5. Auto-save Editor (line 284)
Add `updateItem.mutate(...)` with `editor_id` and `editor_name` after `setForm`.

### 6. Auto-save Prazo (line 330)
Add `updateItem.mutate(...)` with `due_date` after `setForm` in `onSelect`. Also update the "Limpar" button (line 335) to auto-save clearing.

### 7. Remove Save button block (lines 344-349)
Delete the `isDirty && Save button` block.

### 8. Phase cards — remove onClick, change cursor (lines 385-387)
Remove `onClick` handler, change to `cursor-default`. Keep as `<button>` but non-interactive for macro navigation.

Single file, no other changes.

