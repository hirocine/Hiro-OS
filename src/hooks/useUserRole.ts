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
  const { user, loading: authLoading } = useAuth();
  const [roleState, setRoleState] = useState<UserRoleState>({
    role: null,
    loading: true,
    isAdmin: false,
    canDelete: false,
    canImport: false,
  });

  useEffect(() => {
    console.log('🔑 useUserRole: Effect triggered', { 
      userExists: !!user, 
      userEmail: user?.email,
      userId: user?.id,
      authLoading
    });
    
    // Wait for auth to complete loading
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
      return;
    }

    const fetchUserRole = async () => {
      try {
        console.log('🔑 useUserRole: Starting role fetch for user:', user.email);
        setRoleState(prev => ({ ...prev, loading: true }));
        
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        console.log('🔑 useUserRole: Query result', { data, error });

        if (error) {
          if (error.code === 'PGRST116') {
            // Multiple rows found - query for first admin role or default to user
            console.log('🔑 useUserRole: Multiple roles found, querying for admin role');
            const { data: adminData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .eq('role', 'admin')
              .maybeSingle();
            
            const role = adminData?.role || 'user';
            const isAdmin = role === 'admin';
            
            setRoleState({
              role,
              loading: false,
              isAdmin,
              canDelete: isAdmin,
              canImport: isAdmin,
            });
            return;
          }
          
          console.error('🔑 useUserRole: Error fetching role:', error);
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

        console.log('🔑 useUserRole: Role fetched successfully', { 
          role, 
          isAdmin,
          userId: user.id 
        });

        setRoleState({
          role,
          loading: false,
          isAdmin,
          canDelete: isAdmin,
          canImport: isAdmin,
        });
      } catch (error) {
        console.error('🔑 useUserRole: Error in fetchUserRole:', error);
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
  }, [user, authLoading]);

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