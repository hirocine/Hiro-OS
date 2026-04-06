

# Fix EventDetailPopover portal rendering

## Changes in `src/components/Home/RecordingsCalendar.tsx`

### 1. Add import (line 1)
Add `createPortal` from `react-dom`:
```tsx
import { createPortal } from 'react-dom';
```

### 2. Wrap popover return with createPortal (lines 88-93)
Replace the current outer container with a portal-wrapped version:
- `createPortal(..., document.body)` wrapping the entire JSX
- `z-[9999]` instead of `z-50`
- Add `p-4` to outer container
- Backdrop: `bg-black/30 backdrop-blur-sm` instead of `bg-black/20`
- Inner card: `w-[360px] max-w-full` instead of `w-[340px] max-w-[90vw]`, add `animate-in fade-in zoom-in-95 duration-200`

All inner content (color bar, badge, title, date, location, description, footer) stays exactly as is.

