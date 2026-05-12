import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { AuthenticationError, wrapAsync } from '@/lib/errors';
import type { Result } from '@/types/common';
import type { Json } from '@/integrations/supabase/types';

export type UserRole =
  | 'admin'
  | 'user'
  | 'producao'
  | 'marketing'
  | 'comercial'
  | 'edicao'
  | 'financeiro'
  | 'convidado';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole | null;
  roleLoading: boolean;
  isAdmin: boolean;
  canDelete: boolean;
  canImport: boolean;
  isProducao: boolean;
  isMarketing: boolean;
  canAccessSuppliers: boolean;
  canAccessMarketing: boolean;
  signUp: (email: string, password: string, metadata?: { full_name?: string; position?: string; department?: string }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<Result<void>>;
  signInWithGoogle: () => Promise<Result<void>>;
  signOut: () => Promise<{ error: Error | null }>;
  logAuditEntry: (action: string, tableName: string, recordId?: string, oldValues?: Record<string, unknown>, newValues?: Record<string, unknown>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  
  const isInitialized = useRef(false);
  const roleCache = useRef<{ [userId: string]: UserRole }>({});
  const lastSeenSentAt = useRef<number>(0);

  const pingLastSeen = useCallback(async (userId: string) => {
    if (!userId) return;
    const FIVE_MINUTES = 5 * 60 * 1000;
    const now = Date.now();
    if (now - lastSeenSentAt.current < FIVE_MINUTES) return;
    lastSeenSentAt.current = now;
    try {
      await supabase.rpc('update_last_seen');
    } catch (err) {
      logger.debug('update_last_seen failed', { module: 'auth', error: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  const fetchUserRole = useCallback(async (userId: string) => {
    // Use cached value if available
    if (roleCache.current[userId]) {
      const cachedRole = roleCache.current[userId];
      setRole(cachedRole);
      setRoleLoading(false);
      return;
    }

    setRoleLoading(true);
    
    const result = await wrapAsync(async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to fetch user role: ${error.message}`);
      }

      let userRole: UserRole = 'user';
      
      if (data?.role) {
        userRole = data.role as UserRole;
      } else {
        // Create default role if none exists
        await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'user' });
      }

      return userRole;
    });

    if (result.data !== undefined) {
      roleCache.current[userId] = result.data;
      setRole(result.data);
    } else {
      roleCache.current[userId] = 'user';
      setRole('user');
    }
    
    setRoleLoading(false);
  }, []);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
        
        if (newSession?.user) {
          setTimeout(() => {
            fetchUserRole(newSession.user.id);
          }, 0);

          setTimeout(() => {
            pingLastSeen(newSession.user.id);
          }, 0);

          // Check approval asynchronously without blocking the callback
          if (event === 'SIGNED_IN') {
            setTimeout(async () => {
              const { data: profile } = await supabase
                .from('profiles')
                .select('is_approved')
                .eq('user_id', newSession.user.id)
                .maybeSingle();

              if (profile && profile.is_approved === false) {
                await supabase.auth.signOut();
                setSession(null);
                setUser(null);
                setRole(null);
                setRoleLoading(false);
              }
            }, 0);
          }
        } else {
          setRole(null);
          setRoleLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);
      
      if (existingSession?.user) {
        fetchUserRole(existingSession.user.id);
        pingLastSeen(existingSession.user.id);
      } else {
        setRoleLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      isInitialized.current = false;
    };
  }, [fetchUserRole, pingLastSeen]);

  // Ping last_seen when tab returns to focus
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && user?.id) {
        pingLastSeen(user.id);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user?.id, pingLastSeen]);

  const signUp = async (email: string, password: string, metadata?: { 
    full_name?: string; 
    position?: string; 
    department?: string; 
  }) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string): Promise<Result<void>> => {
    const result = await wrapAsync(async () => {
      try {
        const userIP = '127.0.0.1';
        const { data: rateLimitCheck } = await supabase.rpc('check_login_rate_limit', {
          _ip_address: userIP,
          _user_email: email
        });
        
        if (rateLimitCheck && !(rateLimitCheck as Record<string, unknown>).allowed) {
          const rateLimitData = rateLimitCheck as Record<string, unknown>;
          throw new AuthenticationError(
            `Too many login attempts. Try again in ${rateLimitData.retry_after_minutes} minutes.`
          );
        }
      } catch (rateLimitError) {
        logger.warn('Error checking rate limiting', { 
          module: 'auth', 
          error: rateLimitError instanceof Error ? rateLimitError.message : 'Unknown error' 
        });
      }
      
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      try {
        await supabase.rpc('log_login_attempt', {
          _ip_address: '127.0.0.1',
          _user_email: email,
          _success: !error,
          _failure_reason: error?.message || null,
          _user_agent: navigator.userAgent
        });
      } catch (logError) {
        logger.warn('Error logging login attempt', { module: 'auth' });
      }
      
      if (error) {
        throw new AuthenticationError(error.message);
      }

      // Check if user is approved
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_approved')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        
        if (profile && profile.is_approved === false) {
          await supabase.auth.signOut();
          throw new Error('Sua conta está aguardando aprovação de um administrador.');
        }
      }
    });

    return result.error 
      ? { success: false, error: result.error.message }
      : { success: true, data: undefined };
  };

  const signInWithGoogle = async (): Promise<Result<void>> => {
    const result = await wrapAsync(async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          }
        }
      });
      
      if (error) {
        throw new AuthenticationError(error.message);
      }
    });

    return result.error 
      ? { success: false, error: result.error.message }
      : { success: true, data: undefined };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const logAuditEntry = async (
    action: string,
    tableName: string,
    recordId?: string,
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>
  ) => {
    await wrapAsync(async () => {
      await supabase.rpc('log_audit_entry', {
        _action: action,
        _table_name: tableName,
        _record_id: recordId,
        _old_values: oldValues as Json,
        _new_values: newValues as Json,
      });
    });
  };

  const isAdmin = role === 'admin';
  const isProducao = role === 'producao';
  const isMarketing = role === 'marketing';
  const canAccessSuppliers = isAdmin || isProducao;
  const canAccessMarketing = isAdmin || isProducao || isMarketing;

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      role,
      roleLoading,
      isAdmin,
      canDelete: isAdmin,
      canImport: isAdmin,
      isProducao,
      isMarketing,
      canAccessSuppliers,
      canAccessMarketing,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      logAuditEntry,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
