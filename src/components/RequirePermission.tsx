import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { canAccess, type PermissionKey } from '@/lib/permissions';

interface RequirePermissionProps {
  permission: PermissionKey;
  children: ReactNode;
  /** Redirect target when access is denied. Default: '/'. */
  redirectTo?: string;
}

/**
 * Route guard — wraps any element that requires a specific permission.
 * If the user's role does not grant the permission, redirects.
 * If role is still loading, renders nothing (avoids flicker).
 *
 *   <Route path="/marketing/dashboard" element={
 *     <RequirePermission permission="marketing.dashboard">
 *       <MarketingDashboard />
 *     </RequirePermission>
 *   } />
 */
export function RequirePermission({ permission, children, redirectTo = '/' }: RequirePermissionProps) {
  const { role, roleLoading } = useAuthContext();

  if (roleLoading) return null;
  if (!canAccess(role, permission)) return <Navigate to={redirectTo} replace />;

  return <>{children}</>;
}
