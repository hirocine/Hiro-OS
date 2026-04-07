

# Fix PopoverContent z-index and positioning in PPDialog

## File: `src/features/post-production/components/PPDialog.tsx`

### Change
Update both `<PopoverContent>` elements in the date fields grid to add `z-[9999]` to className and `side="bottom"` prop. This ensures the calendar popovers render above the dialog overlay and consistently appear below the trigger.

Both instances change from:
```tsx
<PopoverContent className="w-auto p-0" align="start">
```
to:
```tsx
<PopoverContent className="w-auto p-0 z-[9999]" align="start" side="bottom">
```

No other changes. No other files.

