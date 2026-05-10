import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Flame } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTasks } from '../hooks/useTasks';
import { differenceInDays } from 'date-fns';

const cardWrap: React.CSSProperties = {
  border: '1px solid hsl(var(--ds-line-1))',
  background: 'hsl(var(--ds-surface))',
};

const cardHeader: React.CSSProperties = {
  padding: '14px 18px',
  borderBottom: '1px solid hsl(var(--ds-line-1))',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
};

const cardTitle: React.CSSProperties = {
  fontFamily: '"HN Display", sans-serif',
  fontSize: 14,
  fontWeight: 600,
  color: 'hsl(var(--ds-fg-1))',
};

const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export function UrgentTasksWidget() {
  const navigate = useNavigate();
  const { tasks, isLoading } = useTasks({ priority: 'urgente' });

  const urgentTasks = tasks
    .filter((t) => t.status !== 'concluida' && t.status !== 'arquivada')
    .slice(0, 5);

  const getDaysLabel = (dueDate: string | null) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = parseLocalDate(dueDate);
    const diffDays = differenceInDays(due, today);

    if (diffDays < 0) return { text: `${Math.abs(diffDays)}d atrasada`, color: 'hsl(var(--ds-danger))' };
    if (diffDays === 0) return { text: 'Hoje', color: 'hsl(var(--ds-warning))' };
    return { text: `${diffDays}d`, color: 'hsl(var(--ds-fg-3))' };
  };

  return (
    <div style={cardWrap}>
      <div style={cardHeader}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              display: 'grid',
              placeItems: 'center',
              background: 'hsl(var(--ds-warning) / 0.15)',
              color: 'hsl(var(--ds-warning))',
            }}
          >
            <Flame size={14} strokeWidth={1.5} />
          </div>
          <span style={cardTitle}>Tarefas Urgentes</span>
        </div>
        {urgentTasks.length > 0 && (
          <Link
            to="/tarefas/todas?priority=urgente"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: 'hsl(var(--ds-accent))',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <span>Ver todas</span>
            <ArrowRight size={12} strokeWidth={1.5} />
          </Link>
        )}
      </div>
      <div style={{ padding: 14 }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : urgentTasks.length === 0 ? (
          <p style={{ color: 'hsl(var(--ds-fg-3))', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
            Nenhuma tarefa urgente 🎉
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {urgentTasks.map((task) => {
              const daysLabel = getDaysLabel(task.due_date);
              return (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: 8,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onClick={() => navigate(`/tarefas/${task.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <AlertCircle size={13} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-warning))', flexShrink: 0 }} />
                    <span
                      style={{
                        fontSize: 13,
                        color: 'hsl(var(--ds-fg-1))',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {task.title}
                    </span>
                  </div>
                  {daysLabel && (
                    <span
                      style={{
                        fontSize: 11,
                        color: daysLabel.color,
                        fontVariantNumeric: 'tabular-nums',
                        flexShrink: 0,
                      }}
                    >
                      {daysLabel.text}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
