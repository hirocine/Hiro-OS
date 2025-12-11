import { useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Notification, NotificationFilters, NotificationStats } from '@/types/notification';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { queryKeys } from '@/lib/queryClient';
import { useState } from 'react';

// Fetch function separada para reutilização
async function fetchNotificationsData(): Promise<Notification[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user?.id) {
    return [];
  }

  const { data, error } = await supabase
    .from('user_notification_status')
    .select(`
      is_read,
      read_at,
      notification:notifications!user_notification_status_notification_id_fkey (
        id,
        title,
        description,
        type,
        related_entity,
        entity_id,
        responsible_user_name,
        responsible_user_email,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false, referencedTable: 'notifications' });

  if (error) throw error;

  const processedNotifications: Notification[] = (data || []).map(item => ({
    id: item.notification?.id || '',
    title: item.notification?.title || '',
    description: item.notification?.description,
    type: (item.notification?.type || 'system') as Notification['type'],
    relatedEntity: (item.notification?.related_entity || 'system') as Notification['relatedEntity'],
    entityId: item.notification?.entity_id,
    responsibleUser: item.notification?.responsible_user_name ? {
      id: '',
      name: item.notification.responsible_user_name,
      email: item.notification.responsible_user_email
    } : undefined,
    createdAt: item.notification?.created_at || '',
    updatedAt: item.notification?.updated_at || '',
    isRead: item.is_read,
    readAt: item.read_at
  })).filter(n => n.id !== '');

  return processedNotifications;
}

export function useNotificationsSystem() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<NotificationFilters>({ status: 'all', period: 'all' });

  // React Query para cache automático
  const { data: notifications = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: fetchNotificationsData,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Marcar notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase.rpc('mark_notification_as_read', {
        _notification_id: notificationId
      });

      if (error) throw error;

      // Invalidar cache para refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      toast.success('Notificação marcada como lida');
    } catch (err) {
      logger.error('Failed to mark notification as read', {
        module: 'notifications',
        action: 'mark_as_read',
        data: { notificationId },
        error: err instanceof Error ? err : String(err)
      });
      toast.error('Erro ao marcar notificação como lida');
    }
  }, [queryClient]);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    try {
      const { data: updatedCount, error } = await supabase.rpc('mark_all_notifications_as_read');

      if (error) throw error;

      if (updatedCount > 0) {
        // Invalidar cache para refetch
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        toast.success(`${updatedCount} notificações marcadas como lidas`);
      }
    } catch (err) {
      logger.error('Failed to mark all notifications as read', {
        module: 'notifications',
        action: 'mark_all_as_read',
        error: err instanceof Error ? err : String(err)
      });
      toast.error('Erro ao marcar todas as notificações como lidas');
    }
  }, [queryClient]);

  // Filtrar notificações (memoizado)
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      // Filtro por status
      if (filters.status === 'read' && !notification.isRead) return false;
      if (filters.status === 'unread' && notification.isRead) return false;

      // Filtro por tipo
      if (filters.type && notification.type !== filters.type) return false;

      // Filtro por período
      if (filters.period && filters.period !== 'all') {
        const now = new Date();
        const notificationDate = new Date(notification.createdAt);
        const diffInDays = (now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60 * 24);

        switch (filters.period) {
          case 'today':
            if (diffInDays > 1) return false;
            break;
          case 'week':
            if (diffInDays > 7) return false;
            break;
          case 'month':
            if (diffInDays > 30) return false;
            break;
        }
      }

      // Filtro por responsável
      if (filters.responsible && 
          !notification.responsibleUser?.name.toLowerCase().includes(filters.responsible.toLowerCase())) {
        return false;
      }

      // Filtro por busca
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const titleMatch = notification.title.toLowerCase().includes(searchTerm);
        const descriptionMatch = notification.description?.toLowerCase().includes(searchTerm);
        const responsibleMatch = notification.responsibleUser?.name.toLowerCase().includes(searchTerm);
        
        if (!titleMatch && !descriptionMatch && !responsibleMatch) return false;
      }

      return true;
    });
  }, [notifications, filters]);

  // Separar lidas e não lidas (memoizado)
  const unreadNotifications = useMemo(() => filteredNotifications.filter(n => !n.isRead), [filteredNotifications]);
  const readNotifications = useMemo(() => filteredNotifications.filter(n => n.isRead), [filteredNotifications]);

  // Estatísticas (memoizado)
  const stats: NotificationStats = useMemo(() => ({
    total: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
    read: notifications.filter(n => n.isRead).length,
    byType: {
      project: notifications.filter(n => n.type === 'project').length,
      equipment: notifications.filter(n => n.type === 'equipment').length,
      loan: notifications.filter(n => n.type === 'loan').length,
      system: notifications.filter(n => n.type === 'system').length,
    }
  }), [notifications]);

  // Setup realtime - apenas invalida cache
  useEffect(() => {
    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications'
      }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_notification_status'
      }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    // Data
    notifications: filteredNotifications,
    unreadNotifications,
    readNotifications,
    stats,
    loading,
    error: error ? 'Erro ao carregar notificações' : null,
    
    // Filters
    filters,
    setFilters,
    
    // Actions
    markAsRead,
    markAllAsRead,
    refetch,
    
    // Helpers
    hasUnread: stats.unread > 0,
    canMarkAllAsRead: stats.unread > 0,
  };
}
