

# Fix Vimeo iframe coverage in ProposalPublicPage

## Problem
The Vimeo background video iframe uses `inset-[-25%] w-[150%] h-[150%]` which doesn't cover the full area at certain aspect ratios, causing a white bar on the right.

## Change
**File:** `src/features/proposals/components/ProposalPublicPage.tsx` (lines 207-214)

Replace the wrapper div and iframe with a centered, aspect-ratio-aware approach:
- Wrapper: `absolute inset-0 w-full h-full overflow-hidden`
- Iframe: absolutely positioned at center with `translate(-50%, -50%)`, using `max(100%, 177.78vh)` width and `max(100%, 56.25vw)` height to guarantee full coverage at any viewport ratio

No other files modified. No changes to `src/features/proposals/components/public/`.

