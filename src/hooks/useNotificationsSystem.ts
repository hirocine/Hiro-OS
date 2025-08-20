import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Notification, NotificationFilters, NotificationStats } from '@/types/notification';
import { toast } from 'sonner';

export function useNotificationsSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<NotificationFilters>({ status: 'all', period: 'all' });

  // Buscar notificações
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Query mais simples usando join
      const { data, error } = await supabase
        .from('user_notification_status')
        .select(`
          is_read,
          read_at,
          notifications (
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
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .order('created_at', { ascending: false, referencedTable: 'notifications' });

      if (error) throw error;

      const processedNotifications: Notification[] = (data || []).map(item => ({
        id: item.notifications?.id || '',
        title: item.notifications?.title || '',
        description: item.notifications?.description,
        type: item.notifications?.type as any,
        relatedEntity: item.notifications?.related_entity as any,
        entityId: item.notifications?.entity_id,
        responsibleUser: item.notifications?.responsible_user_name ? {
          id: '',
          name: item.notifications.responsible_user_name,
          email: item.notifications.responsible_user_email
        } : undefined,
        createdAt: item.notifications?.created_at || '',
        updatedAt: item.notifications?.updated_at || '',
        isRead: item.is_read,
        readAt: item.read_at
      })).filter(n => n.id !== ''); // Remove empty notifications

      setNotifications(processedNotifications);
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
      setError('Erro ao carregar notificações');
      toast.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  }, []);

  // Marcar notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase.rpc('mark_notification_as_read', {
        _notification_id: notificationId
      });

      if (error) throw error;

      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true, readAt: new Date().toISOString() }
          : notif
      ));

      toast.success('Notificação marcada como lida');
    } catch (err) {
      console.error('Erro ao marcar como lida:', err);
      toast.error('Erro ao marcar notificação como lida');
    }
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    try {
      const { data: updatedCount, error } = await supabase.rpc('mark_all_notifications_as_read');

      if (error) throw error;

      if (updatedCount > 0) {
        setNotifications(prev => prev.map(notif => ({
          ...notif,
          isRead: true,
          readAt: new Date().toISOString()
        })));

        toast.success(`${updatedCount} notificações marcadas como lidas`);
      }
    } catch (err) {
      console.error('Erro ao marcar todas como lidas:', err);
      toast.error('Erro ao marcar todas as notificações como lidas');
    }
  }, []);

  // Filtrar notificações
  const filteredNotifications = notifications.filter(notification => {
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

  // Separar lidas e não lidas
  const unreadNotifications = filteredNotifications.filter(n => !n.isRead);
  const readNotifications = filteredNotifications.filter(n => n.isRead);

  // Estatísticas
  const stats: NotificationStats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
    read: notifications.filter(n => n.isRead).length,
    byType: {
      project: notifications.filter(n => n.type === 'project').length,
      equipment: notifications.filter(n => n.type === 'equipment').length,
      loan: notifications.filter(n => n.type === 'loan').length,
      system: notifications.filter(n => n.type === 'system').length,
    }
  };

  // Setup realtime
  useEffect(() => {
    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications'
      }, () => {
        fetchNotifications();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_notification_status'
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  // Fetch inicial
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    // Data
    notifications: filteredNotifications,
    unreadNotifications,
    readNotifications,
    stats,
    loading,
    error,
    
    // Filters
    filters,
    setFilters,
    
    // Actions
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
    
    // Helpers
    hasUnread: stats.unread > 0,
    canMarkAllAsRead: stats.unread > 0,
  };
}