

# Fix Build Errors

## Overview
Fix 7 TypeScript errors across 4 edge functions and 1 component. These are pre-existing issues unrelated to the ai-assistant deploy.

## Changes

### 1. `supabase/functions/invite-user/index.ts` (line 158)
Change `error.message` to `error instanceof Error ? error.message : 'Internal server error'`

### 2. `supabase/functions/manage-password/index.ts` (line 130)
Change `error.message` to `error instanceof Error ? error.message : 'Unknown error'`

### 3. `supabase/functions/manage-user/index.ts` (line 143)
Change `error.message` to `error instanceof Error ? error.message : 'Internal server error'`

### 4. `supabase/functions/process-equipment-images/index.ts` (3 fixes)
- **Line 45**: Add type annotation `(eqWord: string) =>` instead of `eqWord =>`
- **Line 152**: Change `error.message` to `error instanceof Error ? error.message : 'Unknown error'`
- **Line 175**: Same `error instanceof Error` pattern

### 5. `src/components/Layout/HiroBubble.tsx` (line 40)
Remove `className` from `<ReactMarkdown>` (not a valid prop in newer versions). Wrap it in a `<div className="flex-1 min-w-0">` instead:
```tsx
<div className="flex-1 min-w-0">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {cleanLine}
  </ReactMarkdown>
</div>
```

