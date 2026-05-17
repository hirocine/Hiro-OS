import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Hash, MessageSquare, Search } from 'lucide-react';
import { useConversations } from '../hooks/useConversations';
import { useAuthContext } from '@/contexts/AuthContext';
import type { ConversationListItem } from '../types/chat.types';

interface Props {
  activeId: string | null;
  onNewChannel: () => void;
  onNewDM: () => void;
}

function Avatar({ url, name, size = 24 }: { url: string | null; name: string; size?: number }) {
  const initials = (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: '1px solid hsl(var(--ds-line-1))',
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'hsl(var(--ds-line-2))',
        color: 'hsl(var(--ds-fg-2))',
        fontSize: 10,
        fontWeight: 500,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      {initials || '?'}
    </div>
  );
}

function ConversationRow({
  conv,
  active,
  onClick,
}: {
  conv: ConversationListItem;
  active: boolean;
  onClick: () => void;
}) {
  const isChannel = conv.type === 'channel';
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '6px 10px',
        background: active ? 'hsl(var(--ds-line-2) / 0.6)' : 'transparent',
        border: 0,
        borderLeft: active ? '2px solid hsl(var(--ds-accent))' : '2px solid transparent',
        cursor: 'pointer',
        textAlign: 'left',
        color: 'hsl(var(--ds-fg-1))',
        fontSize: 13,
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }}
    >
      {isChannel ? (
        <Hash size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))', flexShrink: 0 }} />
      ) : (
        <Avatar url={conv.display_avatar_url} name={conv.display_name} size={20} />
      )}
      <span
        style={{
          flex: 1,
          minWidth: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontWeight: conv.unread_count > 0 ? 600 : 400,
        }}
      >
        {conv.display_name}
      </span>
      {conv.unread_count > 0 && (
        <span
          style={{
            background: 'hsl(var(--ds-accent))',
            color: '#fff',
            fontSize: 10,
            fontWeight: 600,
            padding: '1px 6px',
            borderRadius: 10,
            minWidth: 18,
            textAlign: 'center',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {conv.unread_count > 99 ? '99+' : conv.unread_count}
        </span>
      )}
    </button>
  );
}

export function ChatSidebar({ activeId, onNewChannel, onNewDM }: Props) {
  const { data: conversations = [], isLoading } = useConversations();
  const { isAdmin } = useAuthContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { channels, dms } = useMemo(() => {
    const filtered = search.trim()
      ? conversations.filter((c) =>
          c.display_name.toLowerCase().includes(search.trim().toLowerCase()),
        )
      : conversations;
    return {
      channels: filtered.filter((c) => c.type === 'channel'),
      dms: filtered.filter((c) => c.type === 'dm'),
    };
  }, [conversations, search]);

  const select = (id: string) => navigate(`/chat/${id}`);

  return (
    <aside
      style={{
        width: 260,
        flexShrink: 0,
        borderRight: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-bg))',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid hsl(var(--ds-line-1))' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontFamily: '"HN Display", sans-serif',
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: '-0.01em',
            }}
          >
            Chat
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <Search
            size={13}
            strokeWidth={1.5}
            style={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'hsl(var(--ds-fg-3))',
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            style={{
              width: '100%',
              padding: '6px 8px 6px 26px',
              fontSize: 12,
              background: 'hsl(var(--ds-surface))',
              border: '1px solid hsl(var(--ds-line-1))',
              outline: 'none',
              color: 'hsl(var(--ds-fg-1))',
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {/* Channels */}
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 12px',
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'hsl(var(--ds-fg-3))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Canais
            </span>
            {isAdmin && (
              <button
                type="button"
                onClick={onNewChannel}
                style={{
                  width: 18,
                  height: 18,
                  padding: 0,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  color: 'hsl(var(--ds-fg-3))',
                }}
                title="Novo canal"
                aria-label="Novo canal"
              >
                <Plus size={13} strokeWidth={1.5} />
              </button>
            )}
          </div>
          {channels.length === 0 && !isLoading && (
            <div
              style={{
                padding: '4px 12px',
                fontSize: 11,
                fontStyle: 'italic',
                color: 'hsl(var(--ds-fg-3))',
              }}
            >
              Nenhum canal
            </div>
          )}
          {channels.map((c) => (
            <ConversationRow
              key={c.id}
              conv={c}
              active={c.id === activeId}
              onClick={() => select(c.id)}
            />
          ))}
        </div>

        {/* DMs */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 12px',
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'hsl(var(--ds-fg-3))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Mensagens diretas
            </span>
            <button
              type="button"
              onClick={onNewDM}
              style={{
                width: 18,
                height: 18,
                padding: 0,
                display: 'grid',
                placeItems: 'center',
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                color: 'hsl(var(--ds-fg-3))',
              }}
              title="Nova conversa direta"
              aria-label="Nova conversa direta"
            >
              <Plus size={13} strokeWidth={1.5} />
            </button>
          </div>
          {dms.length === 0 && !isLoading && (
            <div
              style={{
                padding: '4px 12px',
                fontSize: 11,
                fontStyle: 'italic',
                color: 'hsl(var(--ds-fg-3))',
              }}
            >
              Nenhuma conversa
            </div>
          )}
          {dms.map((c) => (
            <ConversationRow
              key={c.id}
              conv={c}
              active={c.id === activeId}
              onClick={() => select(c.id)}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
