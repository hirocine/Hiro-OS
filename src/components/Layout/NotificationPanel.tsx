import { Bell, Clock, AlertTriangle, Info, Check, CheckCheck, Filter, Search, Calendar, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNotificationsSystem } from '@/hooks/useNotificationsSystem';
import { NotificationType } from '@/types/notification';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Z_INDEX } from '@/lib/z-index';

const TYPE_LABELS: Record<NotificationType, string> = {
  project: 'Projeto',
  equipment: 'Equipamento', 
  loan: 'Empréstimo',
  system: 'Sistema'
};

const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
  project: Calendar,
  equipment: Info,
  loan: Clock,
  system: Bell
};

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const {
    unreadNotifications,
    readNotifications,
    stats,
    loading,
    filters,
    setFilters,
    markAsRead,
    markAllAsRead,
    hasUnread,
    canMarkAllAsRead
  } = useNotificationsSystem();

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getNotificationIcon = (type: NotificationType) => {
    const IconComponent = TYPE_ICONS[type];
    return <IconComponent className="h-4 w-4" />;
  };

  const getNotificationColor = (type: NotificationType, isRead: boolean) => {
    const baseOpacity = isRead ? 'opacity-60' : '';
    
    switch (type) {
      case 'project':
        return `text-primary ${baseOpacity}`;
      case 'equipment':
        return `text-warning ${baseOpacity}`;
      case 'loan':
        return `text-success ${baseOpacity}`;
      case 'system':
        return `text-purple-600 dark:text-purple-400 ${baseOpacity}`;
      default:
        return `text-muted-foreground ${baseOpacity}`;
    }
  };

  const NotificationItem = ({ notification, isRead = false }: { notification: any, isRead?: boolean }) => (
    <div className={`flex items-start gap-3 p-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${isRead ? 'opacity-70' : ''}`}>
      <div className={`p-1.5 rounded-full ${getNotificationColor(notification.type, isRead)} bg-muted`}>
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-medium leading-none ${isRead ? 'text-muted-foreground' : ''}`}>
            {notification.title}
          </p>
          {!isRead && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={() => markAsRead(notification.id)}
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
        </div>
        {notification.description && (
          <p className="text-xs text-muted-foreground">
            {notification.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {formatDistanceToNow(new Date(notification.createdAt), { 
              addSuffix: true, 
              locale: ptBR 
            })}
          </span>
          {notification.responsibleUser && (
            <div className="flex items-center gap-1">
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-xs">
                  {notification.responsibleUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-20">
                {notification.responsibleUser.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-muted">
          <Bell className="h-4 w-4" />
          {hasUnread && stats.unread > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-medium min-w-[1.5rem]"
            >
              {stats.unread > 99 ? '99+' : stats.unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0" 
        align="end"
        style={{ zIndex: Z_INDEX.dropdown_menu }}
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notificações</CardTitle>
            <div className="flex items-center gap-2">
              {hasUnread && (
                <Badge variant="secondary" className="text-xs">
                  {stats.unread} novas
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-7 w-7 p-0"
              >
                <Filter className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>

          {showFilters && (
            <div className="px-4 pb-3 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar notificações..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="unread">Não lidas</SelectItem>
                    <SelectItem value="read">Lidas</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={filters.type || 'all'}
                  onValueChange={(value) => handleFilterChange('type', value === 'all' ? undefined : value as NotificationType)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="project">Projetos</SelectItem>
                    <SelectItem value="equipment">Equipamentos</SelectItem>
                    <SelectItem value="loan">Empréstimos</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <CardContent className="p-0">
            {canMarkAllAsRead && (
              <div className="px-4 pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="w-full h-8 text-xs"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Marcar todas como lidas
                </Button>
              </div>
            )}

            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Carregando notificações...
              </div>
            ) : (
              <ScrollArea className="max-h-[60vh]">
                {unreadNotifications.length === 0 && readNotifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium mb-1">Nenhuma notificação</p>
                    <p className="text-xs">Você está em dia com tudo!</p>
                  </div>
                ) : (
                  <div>
                    {/* Notificações não lidas */}
                    {unreadNotifications.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-muted/30">
                          <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                            <Bell className="h-3 w-3" />
                            Não lidas ({unreadNotifications.length})
                          </h4>
                        </div>
                        {unreadNotifications.map((notification) => (
                          <NotificationItem 
                            key={notification.id} 
                            notification={notification} 
                            isRead={false}
                          />
                        ))}
                      </div>
                    )}

                    {/* Separador */}
                    {unreadNotifications.length > 0 && readNotifications.length > 0 && (
                      <Separator className="my-1" />
                    )}

                    {/* Notificações lidas */}
                    {readNotifications.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-muted/10">
                          <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                            <Check className="h-3 w-3" />
                            Lidas ({readNotifications.length})
                          </h4>
                        </div>
                        {readNotifications.slice(0, 10).map((notification) => (
                          <NotificationItem 
                            key={notification.id} 
                            notification={notification} 
                            isRead={true}
                          />
                        ))}
                        {readNotifications.length > 10 && (
                          <div className="p-3 text-center">
                            <Button variant="ghost" size="sm" className="text-xs">
                              Ver mais {readNotifications.length - 10} notificações
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}