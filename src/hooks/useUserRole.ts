import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';
import { wrapAsync } from '@/lib/errors';
import type { Json } from '@/integrations/supabase/types';

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

    const result = await wrapAsync(async () => {
      logger.debug('Fetching user role', { 
        module: 'user-role', 
        data: { userId },
        action: 'fetch_user_role' 
      });
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to fetch user role: ${error.message}`);
      }

      let role: UserRole = 'user';
      
      if (data?.role) {
        role = data.role as UserRole;
      } else {
        // Se não há role, criar uma default
        logger.info('No role found, creating default user role', {
          module: 'user-role',
          data: { userId },
          action: 'create_default_role'
        });
        
        const insertResult = await wrapAsync(async () => {
          return await supabase
            .from('user_roles')
            .insert({ user_id: userId, role: 'user' });
        });

        if (insertResult.error) {
          logger.error('Failed to create default role', {
            module: 'user-role',
            data: { userId },
            error: insertResult.error
          });
        }
      }

      return role;
    });

    if (result.data !== undefined) {
      const role = result.data;
      // Cache a role
      roleCache.current[userId] = role;
      const isAdmin = role === 'admin';

      logger.info('User role fetched and cached successfully', {
        module: 'user-role',
        data: {
          role,
          isAdmin,
          userId
        },
        action: 'role_cached'
      });

      setRoleState({
        role,
        loading: false,
        isAdmin,
        canDelete: isAdmin,
        canImport: isAdmin,
      });
    } else if (result.error) {
      logger.error('Failed to fetch user role, defaulting to user', {
        module: 'user-role',
        data: { userId },
        error: result.error
      });
      
      // Se erro, assume role 'user' e cacheia
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
    
    logger.debug('User role effect triggered', {
      module: 'user-role',
      data: {
        userExists: !!user,
        userEmail: user?.email,
        userId: user?.id,
        authLoading,
        isInitialized: isInitialized.current
      },
      action: 'effect_triggered'
    });
    
    if (authLoading) {
      logger.debug('Auth still loading, waiting for completion', {
        module: 'user-role'
      });
      return;
    }
    
    if (!user) {
      logger.info('No authenticated user, setting default state', {
        module: 'user-role'
      });
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
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>
  ) => {
    const result = await wrapAsync(async () => {
      await supabase.rpc('log_audit_entry', {
        _action: action,
        _table_name: tableName,
        _record_id: recordId,
        _old_values: oldValues as Json,
        _new_values: newValues as Json,
      });
    });

    if (result.error) {
      logger.error('Failed to log audit entry', {
        module: 'user-role',
        data: {
          action,
          tableName,
          recordId
        },
        error: result.error
      });
    } else {
      logger.debug('Audit entry logged successfully', {
        module: 'user-role',
        data: {
          action,
          tableName,
          recordId
        }
      });
    }
  };

  return {
    ...roleState,
    logAuditEntry,
  };
}