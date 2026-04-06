

# Animate the bubble icon on click

## What
Add a spin/rotate transition to the icon inside the floating button when toggling open/close, so the Sparkles icon rotates into the ChevronDown and vice versa.

## Changes in `src/components/Layout/HiroBubble.tsx`

### Lines 110-118 — Replace the button content
Instead of conditionally rendering two different icons, render both icons with absolute positioning and use CSS transitions to rotate/fade between them:

```tsx
<button
  onClick={() => open ? handleClose() : setOpen(true)}
  className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
  aria-label="Assistente Hiro"
>
  <div className="relative w-6 h-6">
    <Sparkles className={`h-6 w-6 absolute inset-0 transition-all duration-300 ${open ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'}`} />
    <ChevronDown className={`h-6 w-6 absolute inset-0 transition-all duration-300 ${open ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'}`} />
  </div>
</button>
```

This creates a smooth crossfade with rotation when toggling — Sparkles rotates out while ChevronDown rotates in, and vice versa.

No other changes.

