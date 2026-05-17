import { useState, useRef, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import type { ChatMessageWithAuthor } from '../types/chat.types';

interface Props {
  message: ChatMessageWithAuthor;
  showHeader: boolean; // first in a streak from same author
  onEdit: (id: string, body: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  const initials = (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
  if (url)
    return (
      <img
        src={url}
        alt={name}
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '1px solid hsl(var(--ds-line-1))',
        }}
      />
    );
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'hsl(var(--ds-line-2))',
        color: 'hsl(var(--ds-fg-2))',
        fontSize: 11,
        fontWeight: 500,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {initials || '?'}
    </div>
  );
}

export function ChatMessage({ message, showHeader, onEdit, onDelete }: Props) {
  const { user, isAdmin } = useAuthContext();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.body);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
      editRef.current.setSelectionRange(editValue.length, editValue.length);
    }
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const isMine = message.user_id === user?.id;
  const canEdit = isMine;
  const canDelete = isMine || isAdmin;
  const isDeleted = !!message.deleted_at;

  const saveEdit = async () => {
    if (editValue.trim() === message.body.trim()) {
      setEditing(false);
      return;
    }
    try {
      await onEdit(message.id, editValue);
      setEditing(false);
    } catch {
      // noop, error stays visible
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: showHeader ? '8px 16px 2px' : '2px 16px 2px 58px',
        position: 'relative',
        background: hover ? 'hsl(var(--ds-line-2) / 0.25)' : 'transparent',
        transition: 'background 0.12s',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {showHeader && <Avatar url={message.author_avatar_url} name={message.author_name ?? '?'} />}

      <div style={{ flex: 1, minWidth: 0 }}>
        {showHeader && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--ds-fg-1))' }}>
              {message.author_name ?? 'Sem nome'}
            </span>
            <span
              style={{
                fontSize: 10,
                color: 'hsl(var(--ds-fg-3))',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatTime(message.created_at)}
            </span>
          </div>
        )}

        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <textarea
              ref={editRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setEditing(false);
                  setEditValue(message.body);
                } else if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  saveEdit();
                }
              }}
              rows={Math.min(6, Math.max(2, editValue.split('\n').length))}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: 13,
                background: 'hsl(var(--ds-surface))',
                border: '1px solid hsl(var(--ds-line-1))',
                outline: 'none',
                color: 'hsl(var(--ds-fg-1))',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" className="btn primary sm" onClick={saveEdit}>
                <Check size={12} strokeWidth={1.5} /> Salvar
              </button>
              <button
                type="button"
                className="btn sm"
                onClick={() => {
                  setEditing(false);
                  setEditValue(message.body);
                }}
              >
                <X size={12} strokeWidth={1.5} /> Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: 13,
              color: isDeleted ? 'hsl(var(--ds-fg-3))' : 'hsl(var(--ds-fg-1))',
              fontStyle: isDeleted ? 'italic' : 'normal',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {isDeleted ? '(mensagem apagada)' : message.body}
            {message.edited_at && !isDeleted && (
              <span style={{ fontSize: 10, color: 'hsl(var(--ds-fg-3))', marginLeft: 6 }}>
                (editado)
              </span>
            )}
          </div>
        )}
      </div>

      {hover && !editing && !isDeleted && (canEdit || canDelete) && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            right: 12,
            display: 'flex',
            gap: 2,
            background: 'hsl(var(--ds-surface))',
            border: '1px solid hsl(var(--ds-line-1))',
            padding: 2,
          }}
        >
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              style={{
                width: 24,
                height: 24,
                padding: 0,
                display: 'grid',
                placeItems: 'center',
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                color: 'hsl(var(--ds-fg-3))',
              }}
              title="Editar"
              aria-label="Editar"
            >
              <Pencil size={12} strokeWidth={1.5} />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Apagar esta mensagem?')) onDelete(message.id);
              }}
              style={{
                width: 24,
                height: 24,
                padding: 0,
                display: 'grid',
                placeItems: 'center',
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                color: 'hsl(var(--ds-fg-3))',
              }}
              title="Apagar"
              aria-label="Apagar"
            >
              <Trash2 size={12} strokeWidth={1.5} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
