import { ReactNode } from 'react';
import { useAuthContext, UserRole } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
  showLoading?: boolean;
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback = null, 
  showLoading = false 
}: RoleGuardProps) {
  const { role, roleLoading: loading } = useAuthContext();

  if (loading && showLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (loading) {
    return null;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Specific guards for common use cases
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function AuthenticatedOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['admin', 'user']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}