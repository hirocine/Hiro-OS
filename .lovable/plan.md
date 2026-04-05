

# Fix question cards not appearing in ProposalGuidedWizard

## Problem
Line 698 sets `opacity: 0` inline with `animationFillMode: 'forwards'`. The `animate-in` class from tailwindcss-animate doesn't override the inline `opacity: 0`, so cards stay invisible.

## Fix — single line change

**File:** `src/features/proposals/components/ProposalGuidedWizard.tsx`, line 697-698

Replace:
```tsx
className="animate-in fade-in slide-in-from-bottom-4"
style={{ opacity: 0, animationDelay: `${i * 200}ms`, animationFillMode: 'forwards' }}
```

With:
```tsx
className="animate-in fade-in slide-in-from-bottom-4 duration-500"
style={{ animationDelay: `${i * 200}ms`, animationFillMode: 'both' }}
```

`animationFillMode: 'both'` applies the animation's initial state (opacity 0 from `fade-in`) before it starts and preserves the final state after it ends — no inline `opacity: 0` needed.

