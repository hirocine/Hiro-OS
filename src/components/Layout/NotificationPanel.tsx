import { Bell, Clock, AlertTriangle, Info, Check, CheckCheck, Filter, Search, Calendar, User, Trash2, CheckSquare, Film, Package, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useNotificationsSystem } from '@/hooks/useNotificationsSystem';
import { useIsMobile } from '@/hooks/use-mobile';
import { NotificationType } from '@/types/notification';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Z_INDEX } from '@/lib/z-index';

const TYPE_LABELS: Record<NotificationType, string> = {
  project: 'Retirada',
  equipment: 'Equipamento', 
  loan: 'Empréstimo',
  system: 'Sistema',
  task: 'Tarefa',
  av_project: 'Projeto AV'
};

const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
  project: Package,
  equipment: Info,
  loan: ArrowRightLeft,
  system: Bell,
  task: CheckSquare,
  av_project: Film
};

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = useIsMobile();
  
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
      case 'task':
        return `text-orange-500 ${baseOpacity}`;
      case 'av_project':
        return `text-pink-500 ${baseOpacity}`;
      default:
        return `text-muted-foreground ${baseOpacity}`;
    }
  };

  const NotificationItem = ({ notification, isRead = false }: { notification: any, isRead?: boolean }) => (
    <div className={`flex items-start gap-3 p-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${isRead ? 'opacity-70' : ''}`}>
      <div className={`p-1.5 rounded-full ${getNotificationColor(notification.type, isRead)} bg-muted`}>
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-medium leading-none truncate ${isRead ? 'text-muted-foreground' : ''}`}>
            {notification.title}
          </p>
          {!isRead && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted flex-shrink-0"
              onClick={() => markAsRead(notification.id)}
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
        </div>
        {notification.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
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

  // Conteúdo compartilhado entre Popover e Drawer
  const NotificationContent = () => (
    <>
      {/* Filtros */}
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
                <SelectItem value="project">Retiradas</SelectItem>
                <SelectItem value="equipment">Equipamentos</SelectItem>
                <SelectItem value="loan">Empréstimos</SelectItem>
                <SelectItem value="task">Tarefas</SelectItem>
                <SelectItem value="av_project">Projetos AV</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Botão marcar todas como lidas */}
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

      {/* Lista de notificações */}
      {loading ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          Carregando notificações...
        </div>
      ) : (
        <ScrollArea className={isMobile ? "h-[calc(100vh-16rem)]" : "max-h-[60vh]"}>
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
    </>
  );

  // Header compartilhado
  const NotificationHeader = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Notificações</span>
        {hasUnread && (
          <Badge variant="secondary" className="text-xs">
            {stats.unread} novas
          </Badge>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowFilters(!showFilters)}
        className="h-7 w-7 p-0"
      >
        <Filter className="h-3 w-3" />
      </Button>
    </div>
  );

  // Botão trigger compartilhado
  const TriggerButton = (
    <Button variant="ghost" size="icon" className="relative text-foreground hover:bg-muted hover:text-foreground">
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
  );

  // Mobile: Drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          {TriggerButton}
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle>
              <NotificationHeader />
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden">
            <NotificationContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Popover
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {TriggerButton}
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
          <CardContent className="p-0">
            <NotificationContent />
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
