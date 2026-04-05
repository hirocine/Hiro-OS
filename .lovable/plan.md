

# Add approval check in onAuthStateChange handler

## File: `src/contexts/AuthContext.tsx`

### Change
Replace the existing `onAuthStateChange` callback (lines ~87-102) with an async version that checks `is_approved` on `SIGNED_IN` events before setting session/user state.

**Current** (sync callback):
```tsx
(event, newSession) => {
  setSession(newSession);
  setUser(newSession?.user ?? null);
  setLoading(false);
  if (newSession?.user) {
    setTimeout(() => { fetchUserRole(newSession.user.id); }, 0);
  } else {
    setRole(null);
    setRoleLoading(false);
  }
}
```

**New** (async, with approval gate):
```tsx
async (event, newSession) => {
  if (event === 'SIGNED_IN' && newSession?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_approved')
      .eq('user_id', newSession.user.id)
      .maybeSingle();

    if (profile && profile.is_approved === false) {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setLoading(false);
      setRole(null);
      setRoleLoading(false);
      return;
    }
  }

  setSession(newSession);
  setUser(newSession?.user ?? null);
  setLoading(false);

  if (newSession?.user) {
    setTimeout(() => { fetchUserRole(newSession.user.id); }, 0);
  } else {
    setRole(null);
    setRoleLoading(false);
  }
}
```

No other changes.

