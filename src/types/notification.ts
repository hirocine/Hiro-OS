export type NotificationType = 'project' | 'equipment' | 'loan' | 'system';
export type NotificationEntity = 'projects' | 'equipments' | 'loans';

export interface NotificationUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface Notification {
  id: string;
  title: string;
  description?: string;
  type: NotificationType;
  relatedEntity?: NotificationEntity;
  entityId?: string;
  responsibleUser?: NotificationUser;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  readAt?: string;
}

export interface NotificationFilters {
  type?: NotificationType;
  status?: 'all' | 'read' | 'unread';
  period?: 'today' | 'week' | 'month' | 'all';
  responsible?: string;
  search?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byType: Record<NotificationType, number>;
}