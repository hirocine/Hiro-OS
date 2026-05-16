import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/clipboard';
import type { 
  PlatformAccess, 
  PlatformAccessForm, 
  PlatformAccessFilters 
} from '../types';

export function usePlatformAccesses() {
  const [filters, setFilters] = useState<PlatformAccessFilters>({});
  const queryClient = useQueryClient();
  const { logAuditEntry } = useUserRole();

  // Fetch platform accesses with creator info
  const { data: accesses = [], isLoading, error: queryError } = useQuery({
    queryKey: ['platform-accesses'],
    queryFn: async () => {
      logger.debug('Fetching platform accesses', { module: 'platform-accesses' });

      const { data, error } = await supabase
        .from('platform_accesses')
        .select(`
          *,
          profiles!platform_accesses_profile_user_id_fkey (
            display_name,
            user_id
          )
        `)
        .order('is_favorite', { ascending: false })
        .order('platform_name', { ascending: true });

      if (error) {
        logger.error('Failed to fetch platform accesses', {
          module: 'platform-accesses',
          error
        });
        throw error;
      }

      logger.info('Platform accesses fetched successfully', {
        module: 'platform-accesses',
        data: { count: data?.length || 0 }
      });

      return (data || []).map(access => ({
        ...access,
        creator_name: (access.profiles as any)?.display_name,
      }));
    }
  });

  // Real-time subscription
  useEffect(() => {
    logger.debug('Setting up real-time subscription for platform accesses', {
      module: 'platform-accesses'
    });

    const channel = supabase
      .channel('platform-accesses-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'platform_accesses'
      }, (payload) => {
        logger.info('Platform accesses changed', {
          module: 'platform-accesses',
          data: { event: payload.eventType }
        });
        queryClient.invalidateQueries({ queryKey: ['platform-accesses'] });
      })
      .subscribe();

    return () => {
      logger.debug('Cleaning up real-time subscription', {
        module: 'platform-accesses'
      });
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Filter accesses
  const filteredAccesses = useMemo(() => {
    let result = accesses;

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(access =>
        access.platform_name.toLowerCase().includes(search) ||
        access.username.toLowerCase().includes(search) ||
        access.category.toLowerCase().includes(search) ||
        (access.notes?.toLowerCase().includes(search))
      );
    }

    if (filters.category && filters.category !== 'all') {
      result = result.filter(access => access.category === filters.category);
    }

    if (filters.favorites) {
      result = result.filter(access => access.is_favorite);
    }

    return result;
  }, [accesses, filters]);

  // Statistics
  const stats = useMemo(() => ({
    total: accesses.length,
    favorites: accesses.filter(a => a.is_favorite).length,
    byCategory: accesses.reduce((acc, access) => {
      acc[access.category] = (acc[access.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  }), [accesses]);

  // Add new access
  const addAccess = useMutation({
    mutationFn: async (form: PlatformAccessForm) => {
      logger.info('Adding new platform access', {
        module: 'platform-accesses',
        data: { platform: form.platformName }
      });

      // 1. Encrypt password via Edge Function
      const { data: encryptData, error: encryptError } = await supabase.functions.invoke(
        'manage-password',
        {
          body: { action: 'encrypt', password: form.password }
        }
      );

      if (encryptError) {
        logger.error('Failed to encrypt password', {
          module: 'platform-accesses',
          error: encryptError
        });
        throw encryptError;
      }

      // 2. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // 3. Insert into database
      const { data, error } = await supabase
        .from('platform_accesses')
        .insert({
          platform_name: form.platformName,
          platform_icon_url: form.platformIconUrl,
          platform_url: form.platformUrl,
          username: form.username,
          encrypted_password: encryptData.encrypted,
          notes: form.notes,
          category: form.category,
          is_favorite: form.isFavorite || false,
          is_active: form.isActive ?? true,
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to insert platform access', {
          module: 'platform-accesses',
          error
        });
        throw error;
      }

      await logAuditEntry(
        'create_platform_access',
        'platform_accesses',
        data.id,
        null,
        { platform_name: data.platform_name }
      );

      logger.info('Platform access created successfully', {
        module: 'platform-accesses',
        data: { id: data.id }
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-accesses'] });
      toast.success('Acesso adicionado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao adicionar acesso: ' + error.message);
    }
  });

  // Update access
  const updateAccess = useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<PlatformAccessForm> 
    }) => {
      logger.info('Updating platform access', {
        module: 'platform-accesses',
        data: { id }
      });

      const updateData: any = {
        platform_name: updates.platformName,
        platform_icon_url: updates.platformIconUrl,
        platform_url: updates.platformUrl,
        username: updates.username,
        notes: updates.notes,
        category: updates.category,
        is_favorite: updates.isFavorite,
        is_active: updates.isActive,
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      // If password changed, encrypt it
      if (updates.password) {
        const { data: encryptData, error: encryptError } = await supabase.functions.invoke(
          'manage-password',
          { body: { action: 'encrypt', password: updates.password } }
        );

        if (encryptError) {
          logger.error('Failed to encrypt password', {
            module: 'platform-accesses',
            error: encryptError
          });
          throw encryptError;
        }
        updateData.encrypted_password = encryptData.encrypted;
      }

      const { error } = await supabase
        .from('platform_accesses')
        .update(updateData)
        .eq('id', id);

      if (error) {
        logger.error('Failed to update platform access', {
          module: 'platform-accesses',
          error
        });
        throw error;
      }

      await logAuditEntry(
        'update_platform_access',
        'platform_accesses',
        id,
        null,
        updateData
      );

      logger.info('Platform access updated successfully', {
        module: 'platform-accesses',
        data: { id }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-accesses'] });
      toast.success('Acesso atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar acesso: ' + error.message);
    }
  });

  // Delete access
  const deleteAccess = useMutation({
    mutationFn: async (id: string) => {
      logger.info('Deleting platform access', {
        module: 'platform-accesses',
        data: { id }
      });

      const { error } = await supabase
        .from('platform_accesses')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Failed to delete platform access', {
          module: 'platform-accesses',
          error
        });
        throw error;
      }

      await logAuditEntry(
        'delete_platform_access',
        'platform_accesses',
        id,
        null,
        null
      );

      logger.info('Platform access deleted successfully', {
        module: 'platform-accesses',
        data: { id }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-accesses'] });
      toast.success('Acesso removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover acesso: ' + error.message);
    }
  });

  // Copy password (decrypt and copy to clipboard)
  const copyPassword = useCallback(async (accessId: string) => {
    try {
      const access = accesses.find(a => a.id === accessId);
      if (!access) {
        toast.error('Acesso não encontrado');
        return;
      }

      logger.info('Decrypting password for copy', {
        module: 'platform-accesses',
        data: { id: accessId }
      });

      // Pass the access id instead of raw ciphertext — backend re-reads the
      // row using the caller's JWT so RLS gates the decrypt.
      const { data, error } = await supabase.functions.invoke(
        'manage-password',
        {
          body: {
            action: 'decrypt',
            platformAccessId: accessId,
          }
        }
      );

      if (error) {
        logger.error('Failed to decrypt password', {
          module: 'platform-accesses',
          error
        });
        throw error;
      }

      const success = await copyToClipboard(data.password);
      if (!success) {
        throw new Error('Falha ao copiar para clipboard');
      }
      toast.success('Senha copiada!');

      logger.info('Password copied successfully', {
        module: 'platform-accesses',
        data: { id: accessId }
      });
    } catch (error) {
      logger.error('Failed to copy password', {
        module: 'platform-accesses',
        error
      });
      toast.error('Erro ao copiar senha');
    }
  }, [accesses]);

  // Toggle favorite
  const toggleFavorite = useMutation({
    mutationFn: async (id: string) => {
      const access = accesses.find(a => a.id === id);
      if (!access) throw new Error('Acesso não encontrado');

      logger.info('Toggling favorite', {
        module: 'platform-accesses',
        data: { id, newValue: !access.is_favorite }
      });

      const { error } = await supabase
        .from('platform_accesses')
        .update({ is_favorite: !access.is_favorite })
        .eq('id', id);

      if (error) {
        logger.error('Failed to toggle favorite', {
          module: 'platform-accesses',
          error
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-accesses'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar favorito: ' + error.message);
    }
  });

  // Copy username to clipboard
  const copyUsername = useCallback(async (username: string) => {
    try {
      const success = await copyToClipboard(username);
      if (!success) {
        throw new Error('Falha ao copiar para clipboard');
      }
      toast.success('Usuário copiado!');
      
      logger.info('Username copied successfully', {
        module: 'platform-accesses',
      });
    } catch (error) {
      logger.error('Failed to copy username', {
        module: 'platform-accesses',
        error
      });
      toast.error('Erro ao copiar usuário');
    }
  }, []);

  // Get password (decrypt and return)
  const getPassword = useCallback(async (accessId: string): Promise<string | null> => {
    try {
      const access = accesses.find(a => a.id === accessId);
      if (!access) {
        toast.error('Acesso não encontrado');
        return null;
      }

      logger.info('Decrypting password for display', {
        module: 'platform-accesses',
        data: { id: accessId }
      });

      // Pass the access id instead of raw ciphertext — backend re-reads the
      // row using the caller's JWT so RLS gates the decrypt.
      const { data, error } = await supabase.functions.invoke(
        'manage-password',
        {
          body: {
            action: 'decrypt',
            platformAccessId: accessId,
          }
        }
      );

      if (error) {
        logger.error('Failed to decrypt password', {
          module: 'platform-accesses',
          error
        });
        toast.error('Erro ao descriptografar senha');
        return null;
      }

      return data.password;
    } catch (error) {
      logger.error('Failed to get password', {
        module: 'platform-accesses',
        error
      });
      toast.error('Erro ao obter senha');
      return null;
    }
  }, [accesses]);

  return {
    accesses: filteredAccesses,
    stats,
    filters,
    setFilters,
    loading: isLoading,
    error: queryError?.message || null,
    addAccess: addAccess.mutateAsync,
    updateAccess: updateAccess.mutateAsync,
    deleteAccess: deleteAccess.mutateAsync,
    copyPassword,
    copyUsername,
    getPassword,
    toggleFavorite: toggleFavorite.mutateAsync,
  };
}
