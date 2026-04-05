
Update only `src/pages/ProposalOverview.tsx`.

1. Replace the body of the existing history `useEffect` with the provided multi-version fetch flow:
   - keep the current `useEffect(() => { ... }, [proposal?.id])` wrapper
   - early return when `!proposal?.id`
   - derive `parentId = proposal.parent_id || proposal.id`
   - fetch all related version IDs from `orcamentos`
   - query `audit_logs` with `.in('record_id', allIds)` and select `id, action, user_email, user_id, created_at`
   - collect unique `user_id`s, fetch matching `profiles`, and merge each log entry with `profile`
   - keep `setHistoryLoading(false)` in all exit paths

2. Ensure the history row render matches the requested avatar/name behavior:
   - inside `Avatar`, render `<AvatarImage src={entry.profile.avatar_url} />` when `avatar_url` exists
   - use fallback text `{(entry.profile?.display_name || entry.user_email || '?')[0].toUpperCase()}`
   - use subtitle `{entry.profile?.display_name || entry.user_email || 'Sistema'}`

3. Do not change anything else in the page.

Technical note:
The current effect is still broken because the `audit_logs` query omits `user_id`, so profile lookup never receives any IDs. Replacing the effect body with the provided version fixes both “all versions” history loading and profile enrichment.
