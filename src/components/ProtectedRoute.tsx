import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { authDebug } from '@/lib/debug';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  authDebug('ProtectedRoute current state', { user: user?.email, loading });

  if (loading) {
    authDebug('Still loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    authDebug('No user, redirecting to auth');
    return <Navigate to="/entrar" replace />;
  }

  authDebug('User authenticated, rendering children');
  return <>{children}</>;
}