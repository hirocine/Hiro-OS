

# Style native date inputs in PPDialog

## File: `src/features/post-production/components/PPDialog.tsx`

### Change 1: Add `cn` import (after line 15)
```tsx
import { cn } from '@/lib/utils';
```

### Change 2: Replace date fields grid (lines 248-269)
Replace both `<Input>` date fields with raw `<input type="date">` elements using `cn()` with platform-matching styles including `[color-scheme:light] dark:[color-scheme:dark]` for native date picker theming, and conditional `text-muted-foreground` when empty.

No Popover, no Calendar, no other files changed.

