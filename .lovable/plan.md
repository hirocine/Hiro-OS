

# Fix 3 issues in PPVideoPage.tsx

## Single file: `src/features/post-production/components/PPVideoPage.tsx`

### 1. Colored badges in selects (lines 236-237, 250-251)
- Line 237: Replace `<SelectValue />` with `<PPStatusBadge status={form.status} />`
- Line 251: Replace `<SelectValue />` with `<PPPriorityBadge priority={form.priority} />`

### 2. Pipeline overflow fix (lines 338, 346)
- Line 338: Change `"flex items-start w-full"` to `"flex items-start w-full overflow-x-auto pb-1"`
- Line 346: Change `"flex flex-col items-center gap-2 shrink-0 group"` to `"flex flex-col items-center gap-2 min-w-[60px] group"`

### 3. "Iniciar Edição" button alignment (lines 427-431)
Replace:
```tsx
<div className="flex justify-center">
  <Button onClick={handleAdvanceStage} size="sm">Iniciar Edição →</Button>
</div>
```
With:
```tsx
<div className="pt-2 border-t border-border">
  <Button onClick={handleAdvanceStage} size="sm" variant="outline">
    Iniciar Edição →
  </Button>
</div>
```

No logic changes. No other files.

