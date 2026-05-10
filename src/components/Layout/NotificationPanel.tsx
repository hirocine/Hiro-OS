import { Bell, Info, Check, CheckCheck, Filter, Trash2, CheckSquare, Film, Package, ArrowRightLeft, type LucideIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useNotificationsSystem } from '@/hooks/useNotificationsSystem';
import { useIsMobile } from '@/hooks/use-mobile';
import { NotificationType } from '@/types/notification';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Z_INDEX } from '@/lib/z-index';

const TYPE_ICONS: Record<NotificationType, LucideIcon> = {
  project: Package,
  equipment: Info,
  loan: ArrowRightLeft,
  system: Bell,
  task: CheckSquare,
  av_project: Film,
};

const TYPE_COLORS: Record<NotificationType, string> = {
  project: 'hsl(var(--ds-accent))',
  equipment: 'hsl(var(--ds-warning))',
  loan: 'hsl(var(--ds-success))',
  system: 'hsl(280 70% 60%)',
  task: 'hsl(var(--ds-warning))',
  av_project: 'hsl(330 70% 60%)',
};

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAllRead, setShowAllRead] = useState(false);
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
    canMarkAllAsRead,
  } = useNotificationsSystem();

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const NotificationItem = ({ notification, isRead = false }: { notification: any; isRead?: boolean }) => {
    const Icon = TYPE_ICONS[notification.type as NotificationType] || Bell;
    const tone = TYPE_COLORS[notification.type as NotificationType] || 'hsl(var(--ds-fg-3))';
    return (
      <div
        style={{
          padding: '12px 18px',
          borderBottom: '1px solid hsl(var(--ds-line-1))',
          background: isRead ? 'hsl(var(--ds-line-2) / 0.15)' : 'transparent',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.35)')}
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = isRead ? 'hsl(var(--ds-line-2) / 0.15)' : 'transparent')
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 24,
              height: 24,
              flexShrink: 0,
              background: 'hsl(var(--ds-line-2) / 0.5)',
              color: tone,
              opacity: isRead ? 0.6 : 1,
            }}
          >
            <Icon size={13} strokeWidth={1.5} />
          </div>
          <p
            style={{
              flex: 1,
              fontSize: 13,
              fontWeight: 500,
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: isRead ? 'hsl(var(--ds-fg-3))' : 'hsl(var(--ds-fg-1))',
            }}
          >
            {notification.title}
          </p>
          {!isRead && (
            <button
              type="button"
              className="btn"
              onClick={() => markAsRead(notification.id)}
              style={{ width: 24, height: 24, padding: 0, justifyContent: 'center', flexShrink: 0 }}
              aria-label="Marcar como lida"
            >
              <Check size={12} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {notification.description && (
          <p
            style={{
              marginTop: 8,
              paddingLeft: 32,
              fontSize: 12,
              color: 'hsl(var(--ds-fg-3))',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {notification.description}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 10,
            paddingLeft: 32,
            fontSize: 11,
            color: 'hsl(var(--ds-fg-3))',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span>
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
          {notification.responsibleUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px]">
                  {notification.responsibleUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span style={{ maxWidth: 96, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {notification.responsibleUser.name.split(' ')[0]}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const NotificationContent = () => (
    <>
      {showFilters && (
        <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Input
            placeholder="Buscar notificações..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger style={{ flex: 1 }}>
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
              onValueChange={(value) =>
                handleFilterChange('type', value === 'all' ? undefined : (value as NotificationType))
              }
            >
              <SelectTrigger style={{ flex: 1 }}>
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

      {canMarkAllAsRead && (
        <div style={{ padding: '0 14px 8px' }}>
          <button
            type="button"
            className="btn"
            onClick={markAllAsRead}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <CheckCheck size={12} strokeWidth={1.5} />
            <span>Marcar todas como lidas</span>
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 18, textAlign: 'center', fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
          Carregando notificações...
        </div>
      ) : (
        <ScrollArea className={isMobile ? 'h-[calc(100vh-16rem)]' : 'max-h-[60vh]'}>
          {unreadNotifications.length === 0 && readNotifications.length === 0 ? (
            <div style={{ padding: 28, textAlign: 'center' }}>
              <Bell
                size={36}
                strokeWidth={1.25}
                style={{ display: 'block', margin: '0 auto 10px', color: 'hsl(var(--ds-fg-4))', opacity: 0.4 }}
              />
              <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-2))', marginBottom: 4 }}>
                Nenhuma notificação
              </p>
              <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>Você está em dia com tudo!</p>
            </div>
          ) : (
            <div>
              {unreadNotifications.length > 0 && (
                <div>
                  <div
                    style={{
                      padding: '8px 18px',
                      background: 'hsl(var(--ds-line-2) / 0.3)',
                    }}
                  >
                    <h4
                      style={{
                        fontSize: 11,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        color: 'hsl(var(--ds-fg-2))',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Bell size={11} strokeWidth={1.5} />
                      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                        Não lidas ({unreadNotifications.length})
                      </span>
                    </h4>
                  </div>
                  {unreadNotifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} isRead={false} />
                  ))}
                </div>
              )}

              {readNotifications.length > 0 && (
                <div>
                  <div
                    style={{
                      padding: '8px 18px',
                      background: 'hsl(var(--ds-line-2) / 0.2)',
                    }}
                  >
                    <h4
                      style={{
                        fontSize: 11,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        color: 'hsl(var(--ds-fg-3))',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Check size={11} strokeWidth={1.5} />
                      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                        Lidas ({readNotifications.length})
                      </span>
                    </h4>
                  </div>
                  {(showAllRead ? readNotifications : readNotifications.slice(0, 10)).map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} isRead={true} />
                  ))}
                  {readNotifications.length > 10 && (
                    <div style={{ padding: 10, textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => setShowAllRead(!showAllRead)}
                        style={{ fontSize: 11 }}
                      >
                        {showAllRead ? 'Mostrar menos' : `Ver mais ${readNotifications.length - 10} notificações`}
                      </button>
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

  const Header = () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px 8px',
      }}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontFamily: '"HN Display", sans-serif',
            fontSize: 13,
            fontWeight: 600,
            color: 'hsl(var(--ds-fg-1))',
          }}
        >
          Notificações
        </span>
        {hasUnread && (
          <span className="pill muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {stats.unread} novas
          </span>
        )}
      </div>
      <button
        type="button"
        className="btn"
        onClick={() => setShowFilters(!showFilters)}
        style={{ width: 28, height: 28, padding: 0, justifyContent: 'center' }}
        aria-label="Filtros"
      >
        <Filter size={12} strokeWidth={1.5} />
      </button>
    </div>
  );

  const TriggerButton = (
    <button
      type="button"
      className="btn"
      style={{
        position: 'relative',
        width: 32,
        height: 32,
        padding: 0,
        justifyContent: 'center',
      }}
      aria-label="Notificações"
    >
      <Bell size={14} strokeWidth={1.5} />
      {hasUnread && stats.unread > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            minWidth: 18,
            height: 18,
            padding: '0 4px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'hsl(var(--ds-danger))',
            color: '#fff',
            fontSize: 10,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {stats.unread > 99 ? '99+' : stats.unread}
        </span>
      )}
    </button>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>{TriggerButton}</SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] px-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Notificações</SheetTitle>
          </SheetHeader>
          <Header />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <NotificationContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{TriggerButton}</PopoverTrigger>
      <PopoverContent
        className="w-96 p-0"
        align="end"
        style={{ zIndex: Z_INDEX.dropdown_menu }}
      >
        <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))' }}>
          <Header />
          <NotificationContent />
        </div>
      </PopoverContent>
    </Popover>
  );
}
