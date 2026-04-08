

# Move "Limpar" buttons outside PopoverContent in PPDialog

## File: `src/features/post-production/components/PPDialog.tsx`

### Change 1: Start date field (lines 276-284)
- Delete the conditional "Limpar" block inside PopoverContent (lines 276-282)
- After `</Popover>` (line 284), add an external clear link:
```tsx
{form.start_date && (
  <button type="button" className="text-xs text-muted-foreground hover:text-foreground mt-1 ml-1" onClick={() => setForm(prev => ({ ...prev, start_date: '' }))}>
    Limpar
  </button>
)}
```

### Change 2: Due date field (lines 306-314)
- Delete the conditional "Limpar" block inside PopoverContent (lines 306-312)
- After `</Popover>` (line 314), add the same external clear link for `due_date`

No other changes. No other files.

