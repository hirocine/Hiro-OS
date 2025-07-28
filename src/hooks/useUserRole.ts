import { useState, useEffect } from 'react';
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
  const { user } = useAuth();
  const [roleState, setRoleState] = useState<UserRoleState>({
    role: null,
    loading: true,
    isAdmin: false,
    canDelete: false,
    canImport: false,
  });

  useEffect(() => {
    if (!user) {
      setRoleState({
        role: null,
        loading: false,
        isAdmin: false,
        canDelete: false,
        canImport: false,
      });
      return;
    }

    const fetchUserRole = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          // Default to 'user' role if not found
          setRoleState({
            role: 'user',
            loading: false,
            isAdmin: false,
            canDelete: false,
            canImport: false,
          });
          return;
        }

        const role = data?.role as UserRole;
        const isAdmin = role === 'admin';

        setRoleState({
          role,
          loading: false,
          isAdmin,
          canDelete: isAdmin,
          canImport: isAdmin,
        });
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setRoleState({
          role: 'user',
          loading: false,
          isAdmin: false,
          canDelete: false,
          canImport: false,
        });
      }
    };

    fetchUserRole();
  }, [user]);

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