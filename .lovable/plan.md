

# Add slide-down + fade-in animation to file chip

## File: `src/features/proposals/components/ProposalGuidedWizard.tsx`

### Change

On line 596, replace:
```tsx
<div className="w-full max-w-2xl mb-4">
```
with:
```tsx
<div className="w-full max-w-2xl mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
```

Single line change. Uses existing shadcn/tailwindcss-animate classes already in the project.

