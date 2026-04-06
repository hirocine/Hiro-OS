

# Create PP Versions and PP Comments hooks

Two new hook files for the post-production feature, leveraging existing `pp_versions` and `pp_comments` tables.

## Files to create

### 1. `src/features/post-production/hooks/usePPVersions.ts`
- `PPVersion` interface matching the `pp_versions` table schema
- `usePPVersions(itemId)` hook with:
  - Query: fetch versions ordered by `version_number` desc
  - `addVersion` mutation: auto-increments version number, archives previous versions, inserts new with `em_revisao` status
  - `updateVersionStatus` mutation: updates a version's status
  - `latestVersion` computed value
  - Toast feedback on success/error

### 2. `src/features/post-production/hooks/usePPComments.ts`
- `PPComment` interface matching the `pp_comments` table schema
- `usePPComments(itemId)` hook with:
  - Query: fetch comments ordered by `created_at` desc
  - `addComment` mutation: inserts comment with current user's name from auth metadata
  - Toast on error

Both hooks use `@tanstack/react-query` for caching/invalidation, `supabase` client for data access, and `sonner` for toasts. No other files changed.

