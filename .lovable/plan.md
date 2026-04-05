

# Add query invalidation after save in ProposalDetails

## Summary
The `useProposalDetailsBySlug` query key is already correct (`['proposal-by-slug', slug]`). The only change needed is in `ProposalDetails.tsx`: import `useQueryClient`, instantiate it, and call `invalidateQueries` after each `await refetch()`.

## File: `src/pages/ProposalDetails.tsx`

### 1. Add import (line 1)
Add `useQueryClient` to a new import from `@tanstack/react-query`:
```ts
import { useQueryClient } from '@tanstack/react-query';
```

### 2. Declare queryClient at top of component
After existing hook calls, add:
```ts
const queryClient = useQueryClient();
```

### 3. Add invalidation after refetch in saveSection (line 468)
After `await refetch();`, add:
```ts
queryClient.invalidateQueries({ queryKey: ['proposals'] });
```

### 4. Add invalidation after refetch in logo upload (line 511)
After `await refetch();`, add:
```ts
queryClient.invalidateQueries({ queryKey: ['proposals'] });
```

No other changes.

