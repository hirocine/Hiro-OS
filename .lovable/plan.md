

# Fix Supabase client import version in ai-proposal-assistant

## Problem
The edge function imports `@supabase/supabase-js@2.97.0` which doesn't exist on esm.sh, causing a runtime error.

## Change
**File: `supabase/functions/ai-proposal-assistant/index.ts`** — Line 2

Replace:
```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";
```
With:
```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
```

No other files changed. Edge function will be redeployed automatically.

