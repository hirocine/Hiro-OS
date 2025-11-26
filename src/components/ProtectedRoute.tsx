import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  logger.debug('ProtectedRoute current state', { 
    module: 'auth',
    data: { user: user?.email, loading }
  });

  if (loading) {
    logger.debug('Still loading, showing spinner', { module: 'auth' });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    logger.debug('No user, redirecting to auth', { module: 'auth' });
    return <Navigate to="/entrar" replace />;
  }

  logger.debug('User authenticated, rendering children', { module: 'auth' });
  return <>{children}</>;
}