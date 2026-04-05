

# Integrate approval status into users table, remove Pendentes tab

## Changes

### 1. `src/pages/Admin.tsx`

**Remove from constants (lines 216, 225, 234):**
- `'pendentes': 'pending'` from ROUTE_TO_TAB
- `'pending': 'pendentes'` from TAB_TO_ROUTE
- `pending: { ... }` from TAB_HEADERS

**Remove state (lines 262-263):**
- `pendingUsers` and `pendingLoading` state declarations

**Remove `fetchPendingUsers` function (lines 408-417)**

**Update `handleApproveUser` (line 425):**
- Change `fetchPendingUsers()` to `fetchUsers()` so the table refreshes

**Update `fetchUsers` (after line 365, before setUsers):**
Add approval status merge:
```tsx
const { data: profiles } = await supabase
  .from('profiles')
  .select('user_id, is_approved');
const approvalMap: Record<string, boolean> = {};
(profiles || []).forEach((p: any) => { approvalMap[p.user_id] = p.is_approved ?? false; });
```
Then in the mapping, add `is_approved: approvalMap[user.id] ?? true` to each user object.

**Remove `fetchPendingUsers()` call from useEffect (line 287)**

**Remove `if (value === 'pending') fetchPendingUsers();` from onValueChange (line 605)**

**Add "Aprovação" column header (after line 641 "Status"):**
```tsx
<TableHead>Aprovação</TableHead>
```

**Update colSpan** from 8 to 9 in loading/empty rows (lines 650, 659).

**Add approval cell in each user row (after Status cell, line 686):**
```tsx
<TableCell>
  {(tableUser as any).is_approved ? (
    <Badge variant="success" className="text-xs">Aprovado</Badge>
  ) : (
    <div className="flex items-center gap-2">
      <Badge variant="warning" className="text-xs">Pendente</Badge>
      <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => handleApproveUser(tableUser.id)}>
        Aprovar
      </Button>
    </div>
  )}
</TableCell>
```

**Remove entire TabsContent value="pending" block (lines 1017-1056)**

**Clean up unused imports:** Remove `Loader2` if no longer used elsewhere.

### 2. `src/components/Layout/DesktopSidebar.tsx`
Remove the `{ name: 'Pendentes', href: '/administracao/pendentes', icon: UserCheck }` line from admin children array. Remove `UserCheck` from imports if unused.

### 3. `src/components/Layout/MobileSidebar.tsx`
Same removal of "Pendentes" nav item and `UserCheck` import cleanup.

### 4. `src/components/Layout/Sidebar.tsx`
No changes needed — the Sidebar.tsx doesn't have a Pendentes entry (it uses flat adminNavigation without children).

