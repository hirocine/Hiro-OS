/**
 * ════════════════════════════════════════════════════════════════
 * TaskHistorySection — timeline com dots coloridos por categoria
 * ════════════════════════════════════════════════════════════════
 *
 * Cada entrada é uma linha enxuta com:
 *   - dot colorido (cor por tipo de ação derivada do field_changed)
 *   - corpo: "Ator <verbo> ..." em texto natural
 *   - timestamp à direita
 *
 * Filtros "Tudo" / "Só sistema" — sistema = user_name === "Sistema"
 * (entry de criação) ou ações automáticas que possam aparecer no
 * futuro (overdue trigger, etc).
 */

import { useState, useMemo } from 'react';
import { History } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useTaskHistory } from '../hooks/useTaskHistory';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskHistorySectionProps {
  taskId: string;
  taskCreatedAt: string;
}

type ToneKey = 'success' | 'info' | 'warning' | 'danger' | 'muted' | 'accent';

const TONE_COLOR: Record<ToneKey, string> = {
  success: 'hsl(var(--ds-success))',
  info:    'hsl(var(--ds-info))',
  warning: 'hsl(var(--ds-warning))',
  danger:  'hsl(var(--ds-danger))',
  muted:   'hsl(var(--ds-fg-4))',
  accent:  'hsl(var(--ds-accent))',
};

function toneOf(action: string, fieldChanged: string | null): ToneKey {
  const lower = (action + ' ' + (fieldChanged ?? '')).toLowerCase();
  if (lower.includes('atras') || lower.includes('exclu')) return 'danger';
  if (lower.includes('priorid')) return 'warning';
  if (lower.includes('status') || lower.includes('atribu')) return 'info';
  if (lower.includes('conclu') || lower.includes('anexo') || lower.includes('anexou')) return 'accent';
  if (lower.includes('coment') || lower.includes('subtar') || lower.includes('link')) return 'success';
  return 'muted';
}

export function TaskHistorySection({ taskId, taskCreatedAt }: TaskHistorySectionProps) {
  const { history, isLoading } = useTaskHistory(taskId);
  const [filter, setFilter] = useState<'all' | 'system'>('all');

  // Memoized so allHistory's deps stay stable across renders.
  const creationEntry = useMemo(
    () => ({
      id: 'creation',
      task_id: taskId,
      user_id: 'system',
      user_name: 'Sistema',
      action: 'Tarefa criada',
      field_changed: null as string | null,
      old_value: null as string | null,
      new_value: null as string | null,
      created_at: taskCreatedAt,
    }),
    [taskId, taskCreatedAt],
  );

  const allHistory = useMemo(
    () => [...history, creationEntry],
    [history, creationEntry],
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return allHistory;
    return allHistory.filter((e) => e.user_name === 'Sistema');
  }, [allHistory, filter]);

  return (
    <section style={{ paddingTop: 8 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <h3
          style={{
            fontFamily: '"HN Display", sans-serif',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'hsl(var(--ds-fg-1))',
            margin: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <History size={13} strokeWidth={1.5} />
          Histórico
        </h3>
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            border: '1px solid hsl(var(--ds-line-2))',
          }}
        >
          {(['all', 'system'] as const).map((k, i) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              style={{
                height: 28,
                padding: '0 12px',
                fontFamily: '"HN Display", sans-serif',
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: filter === k ? 'hsl(var(--ds-fg-1))' : 'hsl(var(--ds-fg-3))',
                background: filter === k ? 'hsl(var(--ds-line-2) / 0.4)' : 'transparent',
                border: 0,
                borderRight: i === 0 ? '1px solid hsl(var(--ds-line-2))' : 0,
                cursor: 'pointer',
                transition: 'background 120ms, color 120ms',
              }}
            >
              {k === 'all' ? 'Tudo' : 'Só sistema'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : (
        <ScrollArea className="max-h-[420px]">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((entry, idx) => {
              const tone = toneOf(entry.action, entry.field_changed);
              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '14px 1fr auto',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom: idx === filtered.length - 1 ? 0 : '1px solid hsl(var(--ds-line-1))',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      background: TONE_COLOR[tone],
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 13,
                      color: 'hsl(var(--ds-fg-2))',
                      lineHeight: 1.45,
                    }}
                  >
                    <strong
                      style={{
                        fontFamily: '"HN Display", sans-serif',
                        fontWeight: 500,
                        color: 'hsl(var(--ds-fg-1))',
                      }}
                    >
                      {entry.user_name || 'Usuário'}
                    </strong>{' '}
                    <span>{entry.action.replace(/^[A-Z]/, (c) => c.toLowerCase())}</span>
                    {entry.old_value && entry.new_value ? (
                      <>
                        {' '}
                        <span
                          style={{
                            fontFamily: '"HN Display", sans-serif',
                            fontSize: 11,
                            color: 'hsl(var(--ds-fg-4))',
                            textDecoration: 'line-through',
                          }}
                        >
                          {entry.old_value}
                        </span>{' '}
                        →{' '}
                        <strong
                          style={{
                            fontFamily: '"HN Display", sans-serif',
                            fontWeight: 500,
                            color: TONE_COLOR[tone],
                          }}
                        >
                          {entry.new_value}
                        </strong>
                      </>
                    ) : null}
                  </div>
                  <span
                    style={{
                      fontFamily: '"HN Display", sans-serif',
                      fontSize: 10,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'hsl(var(--ds-fg-4))',
                      fontVariantNumeric: 'tabular-nums',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {format(new Date(entry.created_at), "dd MMM · HH:mm", { locale: ptBR })}
                  </span>
                </div>
              );
            })}
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: '20px 0',
                  textAlign: 'center',
                  fontSize: 13,
                  color: 'hsl(var(--ds-fg-4))',
                }}
              >
                Nenhuma ação registrada.
              </div>
            ) : null}
          </div>
        </ScrollArea>
      )}
    </section>
  );
}
