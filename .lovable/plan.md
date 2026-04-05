

# Add "Pendentes" tab to Admin for user approval

## Overview
Add a new "Pendentes" section in the Admin area to show users awaiting approval (`is_approved = false`), with an approve button for each.

## Changes

### 1. Sidebar navigation (3 files)
Add `{ name: 'Pendentes', href: '/administracao/pendentes', icon: UserCheck }` to the admin children array in:
- `src/components/Layout/DesktopSidebar.tsx` (after Usuarios line)
- `src/components/Layout/MobileSidebar.tsx` (after Usuarios line)
- `src/components/Layout/Sidebar.tsx` — verify structure and add if children exist

Ensure `UserCheck` is imported from lucide-react in each file.

### 2. Admin.tsx route mappings and logic

**Add to ROUTE_TO_TAB** (line ~208):
```tsx
'pendentes': 'pending',
```

**Add to TAB_TO_ROUTE** (line ~216):
```tsx
'pending': 'pendentes',
```

**Add to TAB_HEADERS** (line ~224):
```tsx
pending: { title: 'Usuários Pendentes', subtitle: 'Aprove novos usuários para liberar o acesso à plataforma.' },
```

**Add state** (near line 238):
```tsx
const [pendingUsers, setPendingUsers] = useState<any[]>([]);
const [pendingLoading, setPendingLoading] = useState(false);
```

**Add fetch function** (after fetchAuditLogs):
```tsx
const fetchPendingUsers = async () => {
  setPendingLoading(true);
  const { data } = await supabase
    .from('profiles')
    .select('user_id, display_name, email, created_at, position, department')
    .eq('is_approved', false)
    .order('created_at', { ascending: false });
  setPendingUsers(data || []);
  setPendingLoading(false);
};
```

**Call in useEffect** (line ~279, add `fetchPendingUsers()` alongside fetchUsers/fetchAuditLogs).

**Add in onValueChange handler** (line ~575 area):
```tsx
if (value === 'pending') fetchPendingUsers();
```

**Add approve handler**:
```tsx
const handleApproveUser = async (userId: string) => {
  await supabase
    .from('profiles')
    .update({ is_approved: true } as any)
    .eq('user_id', userId);
  toast({ title: 'Usuário aprovado!', description: 'O usuário já pode acessar a plataforma.' });
  fetchPendingUsers();
};
```

**Add TabsContent** for "pending" tab with:
- Loading state using `Loader2` spinner
- Empty state using `EmptyState` with `UserCheck` icon
- List of pending users showing name, email, position/department, creation date, and Approve button

**Add imports**: `EmptyState` from `@/components/ui/empty-state`, `Loader2` from lucide-react (if not already imported).

### 3. No database changes needed
The `is_approved` column and RLS policies already exist on the profiles table.

