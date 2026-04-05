

# Block outdated proposal versions with a dedicated screen

## File: `src/features/proposals/components/ProposalPublicPage.tsx`

### 2 changes:

1. **Add blocking screen** — After the `if (error || !proposal)` block (~line 95), insert a new conditional return that checks `proposal.is_latest_version === false`. This renders a centered screen with an AlertTriangle icon, message, and a link to the latest version (if `latestSlug` is available).

2. **Remove yellow banner** — Delete the `{latestSlug && (...)}` yellow banner block from inside the main return (~lines 107-114), since outdated versions will never reach the main render anymore.

No other changes — all existing logic for fetching `latestSlug` via the `useEffect` stays intact.

