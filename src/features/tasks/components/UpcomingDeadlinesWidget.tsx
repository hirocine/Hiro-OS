import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTasks } from '../hooks/useTasks';
import { differenceInDays, format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';

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

const labelTone = (diffDays: number) => {
  if (diffDays === 0) return { color: 'hsl(var(--ds-danger))', borderColor: 'hsl(var(--ds-danger) / 0.3)' };
  if (diffDays === 1) return { color: 'hsl(var(--ds-warning))', borderColor: 'hsl(var(--ds-warning) / 0.3)' };
  return { color: 'hsl(var(--ds-fg-3))' };
};

export function UpcomingDeadlinesWidget() {
  const navigate = useNavigate();
  const { tasks, isLoading } = useTasks();

  const upcomingTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = addDays(today, 7);

    return tasks
      .filter((t) => {
        if (!t.due_date) return false;
        if (t.status === 'concluida' || t.status === 'arquivada') return false;
        const due = parseLocalDate(t.due_date);
        return due >= today && due <= nextWeek;
      })
      .sort((a, b) => {
        const dateA = parseLocalDate(a.due_date!);
        const dateB = parseLocalDate(b.due_date!);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 5);
  }, [tasks]);

  const getDaysLabel = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = parseLocalDate(dueDate);
    const diffDays = differenceInDays(due, today);
    if (diffDays === 0) return { text: 'Hoje', diff: 0 };
    if (diffDays === 1) return { text: 'Amanhã', diff: 1 };
    return { text: `${diffDays} dias`, diff: diffDays };
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
              background: 'hsl(var(--ds-accent) / 0.1)',
              color: 'hsl(var(--ds-accent))',
            }}
          >
            <CalendarDays size={14} strokeWidth={1.5} />
          </div>
          <span style={cardTitle}>Próximas Entregas</span>
        </div>
        {upcomingTasks.length > 0 && (
          <Link
            to="/tarefas/todas"
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
        ) : upcomingTasks.length === 0 ? (
          <p style={{ color: 'hsl(var(--ds-fg-3))', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
            Nenhuma entrega nos próximos 7 dias
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {upcomingTasks.map((task) => {
              const daysLabel = getDaysLabel(task.due_date!);
              const tone = labelTone(daysLabel.diff);
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
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
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
                    <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
                      {format(parseLocalDate(task.due_date!), "dd 'de' MMM", { locale: ptBR })}
                    </span>
                  </div>
                  <span className="pill" style={tone}>
                    {daysLabel.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
