/**
 * ════════════════════════════════════════════════════════════════
 * NotificationPanel — sino do topbar (unificado com Caixa de Entrada)
 * ════════════════════════════════════════════════════════════════
 *
 * Lê da mesma fonte que a página /caixa-de-entrada (`inbox_items`).
 * Substituiu o sistema legado (`notifications` + `user_notification_status`)
 * pra cobrir TUDO: tarefas, orçamentos, CRM, esteira de pós, empréstimos
 * vencidos, aniversários — tudo gateado por permission no banco.
 *
 * Comportamento:
 *   - Click no item → marca como lido + navega pra `deep_link`
 *   - Botão check → marca como lido sem navegar
 *   - Rodapé "Ver tudo" → /caixa-de-entrada com lista completa
 *   - Filtros (status + tipo) escondidos atrás do ícone funil
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Check, CheckCheck, Filter, ArrowRight,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInbox, useInboxUnreadCount } from '@/features/inbox/useInbox';
import type { InboxItem, InboxType, InboxTypeFilter } from '@/features/inbox/types';
import { TYPE_CONFIG } from '@/features/inbox/display';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Z_INDEX } from '@/lib/z-index';

type StatusFilter = 'all' | 'unread' | 'read';

const STATUS_LABEL: Record<StatusFilter, string> = {
  all:    'Todas',
  unread: 'Não lidas',
  read:   'Lidas',
};

const TYPE_FILTER_OPTIONS: { value: InboxTypeFilter; label: string }[] = [
  { value: 'all',       label: 'Todos os tipos' },
  { value: 'task',      label: 'Tarefas' },
  { value: 'proposal',  label: 'Orçamentos' },
  { value: 'deal',      label: 'CRM' },
  { value: 'pp',        label: 'Esteira de Pós' },
  { value: 'loan',      label: 'Empréstimos' },
  { value: 'project',   label: 'Projetos' },
  { value: 'event',     label: 'RH' },
  { value: 'access',    label: 'Plataformas' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'system',    label: 'Sistema' },
];

function isUnread(it: InboxItem, nowMs: number): boolean {
  if (it.read_at) return false;
  if (it.done_at) return false;
  if (it.snooze_until && new Date(it.snooze_until).getTime() > nowMs) return false;
  return true;
}

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<InboxTypeFilter>('all');
  const [search, setSearch] = useState('');
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const { items, markRead, markAllRead } = useInbox();
  const unreadCount = useInboxUnreadCount();

  const nowMs = Date.now();

  // Filter applied to the popover (page Inbox has its own filtering)
  const filtered = items.filter((it) => {
    // Status
    if (statusFilter === 'unread' && !isUnread(it, nowMs)) return false;
    if (statusFilter === 'read' && isUnread(it, nowMs)) return false;
    // Type
    if (typeFilter !== 'all' && it.type !== typeFilter) return false;
    // Search
    if (search) {
      const q = search.toLowerCase();
      const haystack = [it.title, it.preview ?? '', it.actor?.name ?? ''].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const unreadList = filtered.filter((it) => isUnread(it, nowMs));
  const readList = filtered.filter((it) => !isUnread(it, nowMs));

  const handleItemClick = (item: InboxItem) => {
    // Marca como lido sem navegar se já é lido
    if (isUnread(item, nowMs)) {
      markRead(item.id);
    }
    setIsOpen(false);
    if (item.deep_link) {
      navigate(item.deep_link);
    }
  };

  const NotificationItem = ({ item, isRead }: { item: InboxItem; isRead: boolean }) => {
    const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.system;
    const Icon = cfg.Icon;
    return (
      <button
        type="button"
        onClick={() => handleItemClick(item)}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '12px 18px',
          border: 'none',
          borderBottom: '1px solid hsl(var(--ds-line-1))',
          background: isRead ? 'hsl(var(--ds-line-2) / 0.15)' : 'transparent',
          cursor: 'pointer',
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
              color: cfg.color,
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
              margin: 0,
            }}
          >
            {item.title}
          </p>
          {!isRead && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                markRead(item.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  markRead(item.id);
                }
              }}
              className="btn"
              style={{
                width: 24,
                height: 24,
                padding: 0,
                justifyContent: 'center',
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
              }}
              aria-label="Marcar como lida"
            >
              <Check size={12} strokeWidth={1.5} />
            </span>
          )}
        </div>

        {item.preview && (
          <p
            style={{
              marginTop: 8,
              marginBottom: 0,
              paddingLeft: 32,
              fontSize: 12,
              color: 'hsl(var(--ds-fg-3))',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.preview}
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
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
          </span>
          {item.actor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Avatar className="h-5 w-5">
                {item.actor.avatar_url ? <AvatarImage src={item.actor.avatar_url} /> : null}
                <AvatarFallback className="text-[10px]">
                  {item.actor.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span style={{ maxWidth: 96, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.actor.name.split(' ')[0]}
              </span>
            </div>
          )}
        </div>
      </button>
    );
  };

  const NotificationContent = () => (
    <>
      {showFilters && (
        <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Input
            placeholder="Buscar notificações..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger style={{ flex: 1 }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABEL) as StatusFilter[]).map((k) => (
                  <SelectItem key={k} value={k}>{STATUS_LABEL[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as InboxTypeFilter)}>
              <SelectTrigger style={{ flex: 1 }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {unreadCount > 0 && (
        <div style={{ padding: '0 14px 8px' }}>
          <button
            type="button"
            className="btn"
            onClick={() => markAllRead()}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <CheckCheck size={12} strokeWidth={1.5} />
            <span>Marcar todas como lidas</span>
          </button>
        </div>
      )}

      <ScrollArea className={isMobile ? 'h-[calc(100vh-18rem)]' : 'max-h-[60vh]'}>
        {filtered.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center' }}>
            <Bell
              size={36}
              strokeWidth={1.25}
              style={{ display: 'block', margin: '0 auto 10px', color: 'hsl(var(--ds-fg-4))', opacity: 0.4 }}
            />
            <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-2))', marginBottom: 4 }}>
              Nenhuma notificação
            </p>
            <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
              {search || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Tente outro filtro.'
                : 'Você está em dia com tudo!'}
            </p>
          </div>
        ) : (
          <div>
            {unreadList.length > 0 && (
              <div>
                <div style={{ padding: '8px 18px', background: 'hsl(var(--ds-line-2) / 0.3)' }}>
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
                      margin: 0,
                    }}
                  >
                    <Bell size={11} strokeWidth={1.5} />
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                      Não lidas ({unreadList.length})
                    </span>
                  </h4>
                </div>
                {unreadList.map((it) => (
                  <NotificationItem key={it.id} item={it} isRead={false} />
                ))}
              </div>
            )}

            {readList.length > 0 && (
              <div>
                <div style={{ padding: '8px 18px', background: 'hsl(var(--ds-line-2) / 0.2)' }}>
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
                      margin: 0,
                    }}
                  >
                    <Check size={11} strokeWidth={1.5} />
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                      Lidas ({readList.length})
                    </span>
                  </h4>
                </div>
                {readList.slice(0, 20).map((it) => (
                  <NotificationItem key={it.id} item={it} isRead={true} />
                ))}
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div
        style={{
          padding: '8px 14px',
          borderTop: '1px solid hsl(var(--ds-line-1))',
        }}
      >
        <button
          type="button"
          className="btn"
          onClick={() => {
            setIsOpen(false);
            navigate('/caixa-de-entrada');
          }}
          style={{ width: '100%', justifyContent: 'space-between', fontSize: 12 }}
        >
          <span>Abrir Caixa de Entrada</span>
          <ArrowRight size={12} strokeWidth={1.5} />
        </button>
      </div>
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
        {unreadCount > 0 && (
          <span className="pill muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {unreadCount} {unreadCount === 1 ? 'nova' : 'novas'}
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
      {unreadCount > 0 && (
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
          {unreadCount > 99 ? '99+' : unreadCount}
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
