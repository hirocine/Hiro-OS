/**
 * ════════════════════════════════════════════════════════════════
 * MentionTextarea — textarea com autocomplete de @menções
 * ════════════════════════════════════════════════════════════════
 *
 * Detecta `@` na posição atual do cursor, abre um popover com a
 * lista de usuários e filtra conforme o user digita após o `@`.
 * Click no usuário insere `@nome ` no texto e fecha o popover.
 *
 * Não modifica o backend — o texto final fica com `@nome` literal,
 * o highlight visual (azul) é renderizado por renderCommentContent
 * em outro arquivo.
 */

import { useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface MentionUser {
  id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  users: MentionUser[];
  placeholder?: string;
  rows?: number;
  style?: React.CSSProperties;
  className?: string;
  /** Optional: Enter/Cmd+Enter submit. Returns true to consume. */
  onSubmit?: () => void;
}

/** Returns the partial mention being typed at the cursor, or null. */
function readMentionAt(text: string, cursor: number): { start: number; query: string } | null {
  // Walk backwards from cursor looking for '@' before a whitespace
  let i = cursor - 1;
  if (i < 0) return null;
  let buf = '';
  while (i >= 0) {
    const c = text[i];
    if (c === '@') {
      // valid if @ is at start or preceded by whitespace/newline
      const prev = i > 0 ? text[i - 1] : ' ';
      if (/\s/.test(prev) || i === 0) {
        return { start: i, query: buf };
      }
      return null;
    }
    if (/\s/.test(c)) return null;
    buf = c + buf;
    i--;
  }
  return null;
}

function firstName(u: MentionUser): string {
  return (u.display_name || u.email.split('@')[0]).split(' ')[0];
}

export function MentionTextarea({
  value,
  onChange,
  users,
  placeholder,
  rows = 3,
  style,
  className,
  onSubmit,
}: MentionTextareaProps) {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [activeMention, setActiveMention] = useState<{ start: number; query: string } | null>(null);
  const [highlightIdx, setHighlightIdx] = useState(0);

  // Filter users by query
  const filtered = activeMention
    ? users
        .filter((u) => {
          const q = activeMention.query.toLowerCase();
          if (!q) return true;
          const haystack = ((u.display_name ?? '') + ' ' + u.email).toLowerCase();
          return haystack.includes(q);
        })
        .slice(0, 6)
    : [];

  useEffect(() => {
    setHighlightIdx(0);
  }, [activeMention?.query]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    onChange(newVal);
    const cursor = e.target.selectionStart ?? newVal.length;
    setActiveMention(readMentionAt(newVal, cursor));
  };

  const handleSelect = (user: MentionUser) => {
    if (!activeMention) return;
    const before = value.slice(0, activeMention.start);
    const after = value.slice(activeMention.start + 1 + activeMention.query.length);
    const inserted = `@${firstName(user)} `;
    const next = before + inserted + after;
    onChange(next);
    setActiveMention(null);
    // restore focus + cursor after the inserted mention
    setTimeout(() => {
      const el = inputRef.current;
      if (el) {
        const pos = before.length + inserted.length;
        el.focus();
        el.setSelectionRange(pos, pos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (activeMention && filtered.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIdx((i) => (i + 1) % filtered.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIdx((i) => (i - 1 + filtered.length) % filtered.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelect(filtered[highlightIdx]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setActiveMention(null);
        return;
      }
    }

    // Cmd/Ctrl + Enter submits
    if (onSubmit && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <Textarea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setActiveMention(null), 100)}
        placeholder={placeholder}
        rows={rows}
        style={style}
        className={className}
      />

      {activeMention && filtered.length > 0 ? (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            minWidth: 220,
            maxWidth: 320,
            background: 'hsl(var(--ds-bg, var(--ds-surface)))',
            border: '1px solid hsl(var(--ds-line-2))',
            boxShadow: '0 6px 16px -8px rgba(0,0,0,0.15)',
            zIndex: 50,
            maxHeight: 260,
            overflowY: 'auto',
          }}
        >
          {filtered.map((u, idx) => (
            <button
              key={u.id}
              type="button"
              onMouseDown={(e) => {
                // prevent textarea blur before click
                e.preventDefault();
                handleSelect(u);
              }}
              onMouseEnter={() => setHighlightIdx(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '8px 10px',
                background: idx === highlightIdx ? 'hsl(var(--ds-line-2) / 0.5)' : 'transparent',
                border: 0,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 80ms',
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  flexShrink: 0,
                  background: 'hsl(var(--ds-fg-1))',
                  color: 'hsl(var(--ds-bg))',
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: '"HN Display", sans-serif',
                  fontSize: 10,
                  fontWeight: 500,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {u.avatar_url ? (
                  <img
                    src={u.avatar_url}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      position: 'absolute',
                      inset: 0,
                    }}
                  />
                ) : (
                  <span>{(u.display_name?.[0] || u.email[0]).toUpperCase()}</span>
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontFamily: '"HN Display", sans-serif',
                    fontWeight: 500,
                    fontSize: 13,
                    color: 'hsl(var(--ds-fg-1))',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {u.display_name || u.email.split('@')[0]}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'hsl(var(--ds-fg-4))',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  @{firstName(u)}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
