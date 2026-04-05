

# Add user profile data (avatar + display name) to audit history

## File: `src/pages/ProposalOverview.tsx`

### Key finding
The `profiles` table has no `email` column -- but `audit_logs` has `user_id`. We'll join on `user_id` instead of email.

### 1. Update history fetch (lines 98-108)
After fetching audit logs, collect unique `user_id` values and query `profiles` by `user_id`:

```ts
.then(({ data: logs }) => {
  const entries = logs || [];
  const userIds = [...new Set(entries.map((e: any) => e.user_id).filter(Boolean))];
  if (userIds.length === 0) {
    setHistory(entries);
    setHistoryLoading(false);
    return;
  }
  supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', userIds)
    .then(({ data: profiles }) => {
      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p; });
      setHistory(entries.map((e: any) => ({ ...e, profile: e.user_id ? profileMap[e.user_id] || null : null })));
      setHistoryLoading(false);
    });
});
```

### 2. Update history entry render (lines 402-408)
Replace the generic `User` icon div with an `Avatar` component showing the profile photo or initials fallback. Replace email text with display name (falling back to email).

### 3. Remove `User` from lucide imports (line 5)
Check if `User` is used elsewhere in the file first -- it's not, so remove it.

Avatar/AvatarImage/AvatarFallback are already imported (line 11).

