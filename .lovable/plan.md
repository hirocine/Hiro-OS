

# Fix Page 1: Clients at Bottom + Text Visibility

## Problems
1. "Quem confia na Hiro Films" and "Nossos Clientes" text appears faded/buggy in the PDF capture
2. Client logos should be pushed to the bottom of page 1, not immediately after the hero

## Solution

### File: `ProposalPdfDocument.tsx`

**Page 1 layout**: Make it a flex column with the clients section pushed to the bottom via `marginTop: 'auto'`.

**Text fix**: The subtitle and title use `color` values that may get overridden or rendered poorly. Will set explicit high-contrast colors with inline `!important`-equivalent approach and ensure `fontWeight` is strong enough.

Changes:
1. Page 1 `pageStyle` override: add `display: 'flex', flexDirection: 'column'`
2. `PdfClients` wrapper: add `marginTop: 'auto'` so it anchors to the bottom
3. `PdfClients` title text: change color to `#ffffff` (pure white) instead of `#f5f5f5`, increase font weight
4. Subtitle "Quem confia": ensure `color: '#4CFF5C'` and `opacity: 1` are explicit
5. Logo opacity: bump from `0.7` to `0.85` for better visibility

