import { useAuthContext } from '@/contexts/AuthContext';
import { canAccess as canAccessStateless, type PermissionKey } from '@/lib/permissions';

/**
 * React hook around the stateless `canAccess`. Reads the current user's
 * role from AuthContext.
 *
 *   const ok = useCanAccess('marketing.dashboard');
 *   if (ok) { ... }
 *
 * Returns `false` while the role is still loading — call sites should
 * also consult `roleLoading` if they want to show a loader vs redirect.
 */
export function useCanAccess(key: PermissionKey): boolean {
  const { role, roleLoading } = useAuthContext();
  if (roleLoading) return false;
  return canAccessStateless(role, key);
}
