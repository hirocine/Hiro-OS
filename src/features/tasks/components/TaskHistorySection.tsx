import { History, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useTaskHistory } from '../hooks/useTaskHistory';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskHistorySectionProps {
  taskId: string;
  taskCreatedAt: string;
}

const cardWrap: React.CSSProperties = {
  border: '1px solid hsl(var(--ds-line-1))',
  background: 'hsl(var(--ds-surface))',
};

const cardHeader: React.CSSProperties = {
  padding: '14px 18px',
  borderBottom: '1px solid hsl(var(--ds-line-1))',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const cardTitle: React.CSSProperties = {
  fontFamily: '"HN Display", sans-serif',
  fontSize: 14,
  fontWeight: 600,
  color: 'hsl(var(--ds-fg-1))',
};

export function TaskHistorySection({ taskId, taskCreatedAt }: TaskHistorySectionProps) {
  const { history, isLoading } = useTaskHistory(taskId);

  const creationEntry = {
    id: 'creation',
    task_id: taskId,
    user_id: 'system',
    user_name: 'Sistema',
    action: 'Tarefa criada',
    field_changed: null,
    old_value: null,
    new_value: null,
    created_at: taskCreatedAt,
  };

  const allHistory = [...history, creationEntry];

  if (isLoading) {
    return (
      <div style={cardWrap}>
        <div style={cardHeader}>
          <div
            style={{
              width: 28,
              height: 28,
              display: 'grid',
              placeItems: 'center',
              background: 'hsl(var(--ds-line-2))',
              color: 'hsl(var(--ds-fg-3))',
            }}
          >
            <History size={14} strokeWidth={1.5} />
          </div>
          <span style={cardTitle}>Histórico</span>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={cardWrap}>
      <div style={cardHeader}>
        <div
          style={{
            width: 28,
            height: 28,
            display: 'grid',
            placeItems: 'center',
            background: 'hsl(var(--ds-line-2))',
            color: 'hsl(var(--ds-fg-3))',
          }}
        >
          <History size={14} strokeWidth={1.5} />
        </div>
        <span style={cardTitle}>Histórico</span>
      </div>
      <div style={{ padding: 18 }}>
        <ScrollArea className="max-h-[400px]">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allHistory.map((entry) => (
              <div
                key={entry.id}
                style={{
                  padding: 12,
                  border: '1px solid hsl(var(--ds-line-2))',
                  background: 'hsl(var(--ds-surface))',
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                  {entry.action}
                </p>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 6,
                    fontSize: 11,
                    color: 'hsl(var(--ds-fg-3))',
                  }}
                >
                  <User size={11} strokeWidth={1.5} />
                  <span>{entry.user_name}</span>
                  <span>•</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
