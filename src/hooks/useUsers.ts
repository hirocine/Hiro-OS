import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  position: string | null;
  department: string | null;
  role: 'admin' | 'user' | 'producao';
  is_active: boolean;
  avatar_url: string | null;
  user_metadata?: {
    avatar_url?: string;
    picture?: string;
    full_name?: string;
    name?: string;
    provider?: string;
  };
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_users_for_admin');

      if (error) {
        throw error;
      }

      setUsers((data || []).map(user => ({
        ...user,
        user_metadata: user.user_metadata as User['user_metadata']
      })));
    } catch (err) {
      logger.error('Failed to fetch users', {
        module: 'users',
        action: 'fetch_users',
        error: err instanceof Error ? err : String(err)
      });
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
  };
}