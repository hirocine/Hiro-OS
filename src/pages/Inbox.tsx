import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Inbox as InboxIcon,
  ListChecks,
  Film,
  Folder,
  Package,
  Briefcase,
  FileText,
  Radio,
  Key,
  Bell,
  Check,
  Clock,
  Eye,
  EyeOff,
  Gift,
  type LucideIcon,
} from 'lucide-react';
import { useInbox } from '@/features/inbox/useInbox';
import type { InboxItem, InboxReason, InboxTab, InboxType, InboxTypeFilter } from '@/features/inbox/types';
import { StatusPill } from '@/ds/components/StatusPill';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const HN_DISPLAY: React.CSSProperties = { fontFamily: '"HN Display", sans-serif' };

const TYPE_CONFIG: Record<InboxType, { label: string; Icon: LucideIcon; color: string }> = {
  task:      { label: 'Tarefa',      Icon: ListChecks, color: 'hsl(var(--ds-accent))' },
  project:   { label: 'Projeto',     Icon: Folder,     color: 'hsl(var(--ds-info))' },
  loan:      { label: 'Retirada',    Icon: Package,    color: 'hsl(var(--ds-warning))' },
  pp:        { label: 'Esteira',     Icon: Film,       color: 'hsl(var(--ds-accent))' },
  deal:      { label: 'CRM',         Icon: Briefcase,  color: 'hsl(var(--ds-success))' },
  proposal:  { label: 'Orçamento',   Icon: FileText,   color: 'hsl(var(--ds-success))' },
  marketing: { label: 'Marketing',   Icon: Radio,      color: 'hsl(var(--ds-info))' },
  access:    { label: 'Plataforma',  Icon: Key,        color: 'hsl(var(--ds-fg-3))' },
  event:     { label: 'RH',          Icon: Gift,       color: 'hsl(var(--ds-info))' },
  system:    { label: 'Sistema',     Icon: Bell,       color: 'hsl(var(--ds-fg-3))' },
};

const REASON_LABEL: Record<InboxReason, { label: string; tone: 'muted' | 'info' | 'success' | 'warning' | 'danger' | 'accent' }> = {
  assigned:         { label: 'Atribuída',     tone: 'accent' },
  mentioned:        { label: 'Mencionado',    tone: 'info' },
  status_change:    { label: 'Status mudou',  tone: 'info' },
  due_soon:         { label: 'Vencendo',      tone: 'warning' },
  overdue:          { label: 'Atrasada',      tone: 'danger' },
  completed:        { label: 'Concluída',     tone: 'success' },
  approved:         { label: 'Aprovada',      tone: 'success' },
  rejected:         { label: 'Rejeitada',     tone: 'danger' },
  viewed:           { label: 'Visualizada',   tone: 'info' },
  commented:        { label: 'Comentário',    tone: 'muted' },
  new_version:      { label: 'Nova versão',   tone: 'info' },
  birthday:         { label: 'Aniversário',   tone: 'accent' },
  work_anniversary: { label: 'Anos de Hiro',  tone: 'accent' },
};

function isUnread(it: InboxItem, nowMs: number) {
  if (it.read_at) return false;
  if (it.done_at) return false;
  if (it.snooze_until && new Date(it.snooze_until).getTime() > nowMs) return false;
  return true;
}

function isVisibleInTab(it: InboxItem, tab: InboxTab, nowMs: number) {
  const snoozedNow = it.snooze_until && new Date(it.snooze_until).getTime() > nowMs;
  switch (tab) {
    case 'unread':  return !it.read_at && !it.done_at && !snoozedNow;
    case 'all':     return !it.done_at && !snoozedNow;
    case 'done':    return !!it.done_at;
    case 'snoozed': return !!snoozedNow;
  }
}

function dateBucket(iso: string): 'today' | 'yesterday' | 'this_week' | 'older' {
  const d = new Date(iso);
  if (isToday(d)) return 'today';
  if (isYesterday(d)) return 'yesterday';
  if (isThisWeek(d, { weekStartsOn: 0 })) return 'this_week';
  return 'older';
}

const BUCKET_LABEL: Record<ReturnType<typeof dateBucket>, string> = {
  today:     'Hoje',
  yesterday: 'Ontem',
  this_week: 'Esta semana',
  older:     'Mais antigas',
};

const SNOOZE_OPTIONS: { hours: number; label: string }[] = [
  { hours: 4,   label: '4 horas' },
  { hours: 24,  label: 'Amanhã' },
  { hours: 24 * 3, label: 'Daqui 3 dias' },
  { hours: 24 * 7, label: 'Semana que vem' },
];

export default function Inbox() {
  const navigate = useNavigate();
  const { items, markRead, markUnread, markDone, unmarkDone, snooze, unsnooze, markAllRead } = useInbox();

  const [tab, setTab] = useState<InboxTab>('unread');
  const [typeFilter, setTypeFilter] = useState<InboxTypeFilter>('all');

  const nowMs = Date.now();
  const visible = useMemo(() => {
    return items
      .filter((it) => isVisibleInTab(it, tab, nowMs))
      .filter((it) => typeFilter === 'all' || it.type === typeFilter)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, tab, typeFilter]);

  const unreadCount = items.filter((it) => isUnread(it, nowMs)).length;
  const dueTodayCount = items.filter((it) => {
    if (!it.metadata?.due_date) return false;
    return isToday(new Date(it.metadata.due_date));
  }).length;

  const buckets = useMemo(() => {
    const groups: Record<string, InboxItem[]> = { today: [], yesterday: [], this_week: [], older: [] };
    for (const it of visible) groups[dateBucket(it.created_at)].push(it);
    return groups;
  }, [visible]);

  const handleRowClick = (it: InboxItem) => {
    if (!it.read_at) markRead(it.id);
    navigate(it.deep_link);
  };

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <div className="ph">
          <div>
            <h1 className="ph-title">Caixa de Entrada.</h1>
            <p className="ph-sub">
              {unreadCount === 0
                ? 'Tudo lido. Bora produzir.'
                : `${unreadCount} não lida${unreadCount !== 1 ? 's' : ''}${
                    dueTodayCount > 0 ? ` · ${dueTodayCount} com prazo hoje` : ''
                  }`}
            </p>
          </div>
          {unreadCount > 0 && (
            <div className="ph-actions">
              <button className="btn" type="button" onClick={markAllRead}>
                <Eye size={14} strokeWidth={1.5} />
                <span>Marcar tudo como lido</span>
              </button>
            </div>
          )}
        </div>

        {/* Tabs + Filtros */}
        <div
          style={{
            marginTop: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div className="tabs-seg" role="tablist" aria-label="Filtrar inbox">
            {(['unread', 'all', 'done', 'snoozed'] as InboxTab[]).map((t) => {
              const active = tab === t;
              const labels: Record<InboxTab, string> = {
                unread:  'Não lidas',
                all:     'Tudo',
                done:    'Feitas',
                snoozed: 'Em soneca',
              };
              const count = items.filter((it) => isVisibleInTab(it, t, nowMs)).length;
              return (
                <button
                  key={t}
                  type="button"
                  className={'s' + (active ? ' on' : '')}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t)}
                >
                  {labels[t]}
                  {count > 0 && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 10,
                        color: active ? 'hsl(var(--ds-fg-3))' : 'hsl(var(--ds-fg-4))',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as InboxTypeFilter)}>
            <SelectTrigger className="w-44" aria-label="Filtrar por tipo">
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {(Object.keys(TYPE_CONFIG) as InboxType[]).map((k) => (
                <SelectItem key={k} value={k}>{TYPE_CONFIG[k].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista */}
        <div style={{ marginTop: 16 }}>
          {visible.length === 0 ? (
            <EmptyState tab={tab} />
          ) : (
            <div
              style={{
                border: '1px solid hsl(var(--ds-line-1))',
                background: 'hsl(var(--ds-surface))',
              }}
            >
              {(['today', 'yesterday', 'this_week', 'older'] as const).map((bucket) => {
                const list = buckets[bucket];
                if (list.length === 0) return null;
                return (
                  <div key={bucket}>
                    <div
                      style={{
                        padding: '10px 18px 6px',
                        fontSize: 10,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        color: 'hsl(var(--ds-fg-4))',
                        background: 'hsl(var(--ds-line-2) / 0.2)',
                        borderTop: '1px solid hsl(var(--ds-line-1))',
                      }}
                    >
                      {BUCKET_LABEL[bucket]}
                    </div>
                    {list.map((it) => (
                      <Row
                        key={it.id}
                        item={it}
                        onClick={() => handleRowClick(it)}
                        onMarkRead={() => markRead(it.id)}
                        onMarkUnread={() => markUnread(it.id)}
                        onMarkDone={() => markDone(it.id)}
                        onUnmarkDone={() => unmarkDone(it.id)}
                        onSnooze={(h) => snooze(it.id, h)}
                        onUnsnooze={() => unsnooze(it.id)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────

function Row({
  item,
  onClick,
  onMarkRead,
  onMarkUnread,
  onMarkDone,
  onUnmarkDone,
  onSnooze,
  onUnsnooze,
}: {
  item: InboxItem;
  onClick: () => void;
  onMarkRead: () => void;
  onMarkUnread: () => void;
  onMarkDone: () => void;
  onUnmarkDone: () => void;
  onSnooze: (hours: number) => void;
  onUnsnooze: () => void;
}) {
  const cfg = TYPE_CONFIG[item.type];
  const reason = REASON_LABEL[item.reason];
  const unread = !item.read_at && !item.done_at;
  const snoozed = item.snooze_until && new Date(item.snooze_until).getTime() > Date.now();
  const done = !!item.done_at;
  const [snoozeOpen, setSnoozeOpen] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: '14px 18px',
        borderTop: '1px solid hsl(var(--ds-line-1))',
        background: unread ? 'transparent' : 'hsl(var(--ds-line-2) / 0.08)',
        position: 'relative',
        cursor: 'pointer',
      }}
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.25)')}
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = unread ? 'transparent' : 'hsl(var(--ds-line-2) / 0.08)')
      }
    >
      {/* Unread dot */}
      {unread && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 6,
            top: 22,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'hsl(var(--ds-accent))',
          }}
        />
      )}

      {/* Type icon */}
      <div
        style={{
          width: 32,
          height: 32,
          display: 'grid',
          placeItems: 'center',
          border: '1px solid hsl(var(--ds-line-1))',
          background: 'hsl(var(--ds-surface))',
          color: cfg.color,
          flexShrink: 0,
        }}
      >
        <cfg.Icon size={14} strokeWidth={1.5} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              ...HN_DISPLAY,
              fontSize: 14,
              fontWeight: unread ? 600 : 500,
              color: done ? 'hsl(var(--ds-fg-3))' : 'hsl(var(--ds-fg-1))',
              textDecoration: done ? 'line-through' : 'none',
            }}
          >
            {item.title}
          </span>
          <StatusPill label={reason.label} tone={reason.tone} />
          {item.metadata?.priority === 'urgent' && (
            <StatusPill label="Urgente" tone="danger" icon="🔥" />
          )}
          {item.metadata?.priority === 'high' && (
            <StatusPill label="Alta" tone="warning" />
          )}
        </div>

        {item.preview && (
          <p
            style={{
              fontSize: 13,
              color: 'hsl(var(--ds-fg-3))',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              margin: 0,
            }}
          >
            {item.preview}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 11,
            color: 'hsl(var(--ds-fg-4))',
            fontVariantNumeric: 'tabular-nums',
            marginTop: 2,
          }}
        >
          {item.actor && <span>{item.actor.name}</span>}
          {item.actor && <span>·</span>}
          <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}</span>
          {item.metadata?.due_date && (
            <>
              <span>·</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Clock size={11} strokeWidth={1.5} />
                prazo {formatDistanceToNow(new Date(item.metadata.due_date), { addSuffix: true, locale: ptBR })}
              </span>
            </>
          )}
          {item.metadata?.overdue_days != null && item.metadata.overdue_days > 0 && (
            <>
              <span>·</span>
              <span style={{ color: 'hsl(var(--ds-danger))' }}>
                {item.metadata.overdue_days}d em atraso
              </span>
            </>
          )}
          {snoozed && item.snooze_until && (
            <>
              <span>·</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Clock size={11} strokeWidth={1.5} />
                volta {formatDistanceToNow(new Date(item.snooze_until), { addSuffix: true, locale: ptBR })}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Hover actions */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <button
            className="btn ghost icon sm"
            type="button"
            onClick={onUnmarkDone}
            title="Reabrir"
          >
            <Check size={13} strokeWidth={1.5} />
          </button>
        ) : (
          <button
            className="btn ghost icon sm"
            type="button"
            onClick={onMarkDone}
            title="Marcar como feita"
          >
            <Check size={13} strokeWidth={1.5} />
          </button>
        )}

        {snoozed ? (
          <button
            className="btn ghost icon sm"
            type="button"
            onClick={onUnsnooze}
            title="Tirar da soneca"
          >
            <Clock size={13} strokeWidth={1.5} />
          </button>
        ) : (
          <div style={{ position: 'relative' }}>
            <button
              className="btn ghost icon sm"
              type="button"
              onClick={() => setSnoozeOpen((v) => !v)}
              title="Soneca"
            >
              <Clock size={13} strokeWidth={1.5} />
            </button>
            {snoozeOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 4px)',
                  background: 'hsl(var(--ds-surface))',
                  border: '1px solid hsl(var(--ds-line-1))',
                  boxShadow: '0 4px 12px hsl(0 0% 0% / 0.08)',
                  zIndex: 10,
                  minWidth: 160,
                }}
              >
                {SNOOZE_OPTIONS.map((opt) => (
                  <button
                    key={opt.hours}
                    type="button"
                    onClick={() => {
                      onSnooze(opt.hours);
                      setSnoozeOpen(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: 12,
                      textAlign: 'left',
                      color: 'hsl(var(--ds-fg-2))',
                      background: 'transparent',
                      border: 0,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.4)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {item.read_at ? (
          <button
            className="btn ghost icon sm"
            type="button"
            onClick={onMarkUnread}
            title="Marcar como não lida"
          >
            <EyeOff size={13} strokeWidth={1.5} />
          </button>
        ) : (
          <button
            className="btn ghost icon sm"
            type="button"
            onClick={onMarkRead}
            title="Marcar como lida"
          >
            <Eye size={13} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: InboxTab }) {
  const copy: Record<InboxTab, { title: string; sub: string }> = {
    unread:  { title: 'Caixa zerada. Bora produzir.',     sub: 'Nada de novo precisando da sua atenção.' },
    all:     { title: 'Nada por aqui ainda.',             sub: 'Atividades que envolvem você aparecem aqui.' },
    done:    { title: 'Nada resolvido ainda.',            sub: 'Marque items como feitos pra ver o histórico.' },
    snoozed: { title: 'Sem items em soneca.',             sub: 'Você pode adiar items pra reaparecerem depois.' },
  };
  return (
    <div
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        padding: '64px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          margin: '0 auto 16px',
          display: 'grid',
          placeItems: 'center',
          border: '1px solid hsl(var(--ds-line-1))',
          color: 'hsl(var(--ds-fg-3))',
        }}
      >
        <InboxIcon size={20} strokeWidth={1.5} />
      </div>
      <h3 style={{ ...HN_DISPLAY, fontSize: 16, fontWeight: 600, color: 'hsl(var(--ds-fg-1))' }}>
        {copy[tab].title}
      </h3>
      <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', marginTop: 6 }}>{copy[tab].sub}</p>
    </div>
  );
}
