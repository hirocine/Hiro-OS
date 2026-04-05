

# Fix Auth.tsx right panel layout

## File: `src/pages/Auth.tsx`

### 3 find-and-replace changes:

1. **Right panel container**: `className="w-[420px] flex items-center justify-center p-6 lg:p-10"` → `className="flex-1 flex items-center justify-center p-8 lg:p-16"`

2. **Form wrapper**: `className="w-full max-w-xs space-y-8"` → `className="w-full max-w-sm space-y-8"`

3. **Left panel width**: `w-[52%]` → `w-[60%]`

No other changes.

