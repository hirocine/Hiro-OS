

# Fix ProposalHero Background — Match Original Project

## Root Cause

The original "Proposta Hiro Films" project has a clean global CSS: just `body { overflow-x: hidden }`. The current project has aggressive global scrollbar overrides (`scrollbar-gutter: stable`, `overflow-y: scroll !important`, `overflow-x: hidden !important`) that affect layout width calculations.

The `ProposalPublicPage` wrapper already has `overflow-hidden`, but the `<section>` with `proposal-content-px` (300px padding on xl) creates a wider content area for the absolutely positioned backgrounds to spread into. Combined with the scrollbar-gutter and the `inset-[-10%] w-[120%]` gradients, the green glow bleeds to the right.

## Fix

### 1. Scope-reset global scrollbar overrides for proposal page

In `src/index.css`, add a scoped override for `.proposal-page` that neutralizes the scrollbar-gutter and overflow hacks:

```css
.proposal-page {
  scrollbar-gutter: auto !important;
}
.proposal-page,
.proposal-page * {
  --removed-body-scroll-bar-size: 0 !important;
}
```

### 2. Ensure ProposalHero backgrounds are contained

The `<section>` uses `proposal-content-px` which adds 300px horizontal padding. The `absolute inset-0` backgrounds span the full section including padding — this is correct and matches the original. The issue is only the scrollbar-gutter pushing content.

## Files changed

| File | Change |
|---|---|
| `src/index.css` | Add `.proposal-page` scoped overrides to neutralize scrollbar-gutter |

