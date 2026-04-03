

# Fix Double Scroll on Proposal Page

## Problem

Two scrollbars appear because:
1. `html` has `overflow-y: scroll !important` and `scrollbar-gutter: stable` (global rule for the app)
2. `.proposal-page` CSS adds `overflow-y: auto !important`, creating a second scrollable container
3. The `.proposal-page` div in JSX has `overflow-hidden` class, which conflicts with the CSS override

## Solution

**File: `src/index.css`**
- Remove `overflow-y: auto !important` from `.proposal-page` — the div should NOT scroll independently
- Instead, target `html` when proposal page is active using `:has(.proposal-page)` to disable `scrollbar-gutter: stable` and reset to normal scrolling

```css
html:has(.proposal-page) {
  scrollbar-gutter: auto !important;
}

.proposal-page {
  font-family: 'Helvetica Now Display', 'Inter', sans-serif;
  line-height: 1.6;
  /* Remove overflow-y: auto !important */
}
```

**File: `src/features/proposals/components/ProposalPublicPage.tsx`**
- Keep `overflow-hidden` on the div (prevents horizontal overflow from glow effects) — this is fine since vertical scrolling happens on `html`/`body`, not this div. Actually, change to `overflow-x-hidden` to be explicit and not clip vertical content.

One CSS change, one className tweak.

