import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'user';

interface UserRoleState {
  role: UserRole | null;
  loading: boolean;
  isAdmin: boolean;
  canDelete: boolean;
  canImport: boolean;
}

export function useUserRole() {
  const { user, loading: authLoading } = useAuth();
  const [roleState, setRoleState] = useState<UserRoleState>({
    role: null,
    loading: true,
    isAdmin: false,
    canDelete: false,
    canImport: false,
  });
  
  // Cache de role para evitar múltiplas consultas
  const roleCache = useRef<{ [userId: string]: UserRole }>({});
  const isInitialized = useRef(false);

  const fetchUserRole = useCallback(async (userId: string) => {
    // Se já está no cache, usar o valor cacheado
    if (roleCache.current[userId]) {
      const cachedRole = roleCache.current[userId];
      const isAdmin = cachedRole === 'admin';
      setRoleState({
        role: cachedRole,
        loading: false,
        isAdmin,
        canDelete: isAdmin,
        canImport: isAdmin,
      });
      return;
    }

    try {
      console.log('🔑 useUserRole: Fetching role for user:', userId);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('🔑 useUserRole: Error fetching role:', error);
        // Se erro, assume role 'user' e cacheia
        roleCache.current[userId] = 'user';
        setRoleState({
          role: 'user',
          loading: false,
          isAdmin: false,
          canDelete: false,
          canImport: false,
        });
        return;
      }

      let role: UserRole = 'user';
      
      if (data?.role) {
        role = data.role as UserRole;
      } else {
        // Se não há role, criar uma default
        console.log('🔑 useUserRole: No role found, creating default');
        try {
          await supabase
            .from('user_roles')
            .insert({ user_id: userId, role: 'user' });
        } catch (insertError) {
          console.error('🔑 useUserRole: Error creating default role:', insertError);
        }
      }

      // Cache a role
      roleCache.current[userId] = role;
      const isAdmin = role === 'admin';

      console.log('🔑 useUserRole: Role fetched and cached:', { 
        role, 
        isAdmin,
        userId 
      });

      setRoleState({
        role,
        loading: false,
        isAdmin,
        canDelete: isAdmin,
        canImport: isAdmin,
      });
    } catch (error) {
      console.error('🔑 useUserRole: Unexpected error:', error);
      roleCache.current[userId] = 'user';
      setRoleState({
        role: 'user',
        loading: false,
        isAdmin: false,
        canDelete: false,
        canImport: false,
      });
    }
  }, []);

  useEffect(() => {
    // Evitar múltiplas inicializações
    if (isInitialized.current) return;
    
    console.log('🔑 useUserRole: Effect triggered', { 
      userExists: !!user, 
      userEmail: user?.email,
      userId: user?.id,
      authLoading,
      isInitialized: isInitialized.current
    });
    
    if (authLoading) {
      console.log('🔑 useUserRole: Auth still loading, waiting...');
      return;
    }
    
    if (!user) {
      console.log('🔑 useUserRole: No user, setting default state');
      setRoleState({
        role: null,
        loading: false,
        isAdmin: false,
        canDelete: false,
        canImport: false,
      });
      isInitialized.current = true;
      return;
    }

    isInitialized.current = true;
    fetchUserRole(user.id);
  }, [user, authLoading, fetchUserRole]);

  const logAuditEntry = async (
    action: string,
    tableName: string,
    recordId?: string,
    oldValues?: any,
    newValues?: any
  ) => {
    try {
      await supabase.rpc('log_audit_entry', {
        _action: action,
        _table_name: tableName,
        _record_id: recordId,
        _old_values: oldValues,
        _new_values: newValues,
      });
    } catch (error) {
      console.error('Error logging audit entry:', error);
    }
  };

  return {
    ...roleState,
    logAuditEntry,
  };
}