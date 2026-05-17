import { useEffect, useRef, useState } from 'react';
import { Hash, MessageSquare, Send } from 'lucide-react';
import { useMessages } from '../hooks/useMessages';
import { ChatMessage } from './ChatMessage';
import type { ConversationListItem } from '../types/chat.types';
import { useAuthContext } from '@/contexts/AuthContext';

interface Props {
  conversation: ConversationListItem;
}

export function ChatConversation({ conversation }: Props) {
  const { user } = useAuthContext();
  const { messages, loading, sendMessage, editMessage, deleteMessage, markAsRead } = useMessages(
    conversation.id,
  );
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, conversation.id]);

  // mark as read whenever messages update and tab is visible
  useEffect(() => {
    if (messages.length > 0 && document.visibilityState === 'visible') {
      markAsRead();
    }
  }, [messages, markAsRead]);

  // focus input on conversation change
  useEffect(() => {
    inputRef.current?.focus();
  }, [conversation.id]);

  const handleSend = async () => {
    const v = input.trim();
    if (!v || sending) return;
    setSending(true);
    setInput('');
    try {
      await sendMessage(v);
    } catch (err) {
      setInput(v); // restore on error
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const isChannel = conversation.type === 'channel';
  const memberCount = conversation.members.length;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'hsl(var(--ds-surface))',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid hsl(var(--ds-line-1))',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        {isChannel ? (
          <Hash size={15} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
        ) : (
          <MessageSquare size={15} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
        )}
        <span
          style={{
            fontFamily: '"HN Display", sans-serif',
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            color: 'hsl(var(--ds-fg-1))',
          }}
        >
          {conversation.display_name}
        </span>
        <span
          style={{
            fontSize: 11,
            color: 'hsl(var(--ds-fg-3))',
            marginLeft: 4,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          · {memberCount} {memberCount === 1 ? 'membro' : 'membros'}
        </span>
        {conversation.description && (
          <span
            style={{
              fontSize: 11,
              color: 'hsl(var(--ds-fg-3))',
              marginLeft: 8,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            — {conversation.description}
          </span>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {loading && (
          <div
            style={{
              padding: '32px 16px',
              fontSize: 12,
              color: 'hsl(var(--ds-fg-3))',
              textAlign: 'center',
            }}
          >
            Carregando mensagens...
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div
            style={{
              padding: '48px 16px',
              fontSize: 13,
              color: 'hsl(var(--ds-fg-3))',
              textAlign: 'center',
            }}
          >
            {isChannel
              ? `Bem-vindo ao canal #${conversation.display_name}. Diga oi 👋`
              : 'Comece a conversa.'}
          </div>
        )}
        {messages.map((m, idx) => {
          const prev = messages[idx - 1];
          const showHeader =
            !prev ||
            prev.user_id !== m.user_id ||
            new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() > 5 * 60 * 1000;
          return (
            <ChatMessage
              key={m.id}
              message={m}
              showHeader={showHeader}
              onEdit={editMessage}
              onDelete={deleteMessage}
            />
          );
        })}
      </div>

      {/* Composer */}
      <div
        style={{
          padding: 12,
          borderTop: '1px solid hsl(var(--ds-line-1))',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            border: '1px solid hsl(var(--ds-line-1))',
            background: 'hsl(var(--ds-bg))',
            padding: 8,
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Mensagem para ${isChannel ? '#' + conversation.display_name : conversation.display_name}`}
            rows={1}
            disabled={sending}
            style={{
              flex: 1,
              background: 'transparent',
              border: 0,
              outline: 'none',
              resize: 'none',
              fontSize: 13,
              color: 'hsl(var(--ds-fg-1))',
              fontFamily: 'inherit',
              minHeight: 22,
              maxHeight: 160,
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="btn primary sm"
            style={{
              opacity: !input.trim() || sending ? 0.4 : 1,
              cursor: !input.trim() || sending ? 'not-allowed' : 'pointer',
              width: 28,
              height: 28,
              padding: 0,
              justifyContent: 'center',
            }}
            aria-label="Enviar"
          >
            <Send size={13} strokeWidth={1.5} />
          </button>
        </div>
        <div
          style={{
            fontSize: 10,
            color: 'hsl(var(--ds-fg-3))',
            marginTop: 4,
            paddingLeft: 2,
          }}
        >
          Enter envia · Shift+Enter quebra linha
        </div>
      </div>
    </div>
  );
}
