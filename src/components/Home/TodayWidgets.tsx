import { useNavigate } from 'react-router-dom';
import { Film, CheckSquare, Video, ArrowRight, type LucideIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { usePostProduction } from '@/features/post-production/hooks/usePostProduction';
import { PP_PRIORITY_ORDER, PP_PRIORITY_CONFIG } from '@/features/post-production/types';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { useRecordingsToday, getEventTitle } from '@/hooks/useRecordingsCalendar';
import { useAuthContext } from '@/contexts/AuthContext';
import { CountUp } from '@/ds/components/CountUp';

const today = new Date().toLocaleDateString('en-CA');

interface WidgetCardProps {
  Icon: LucideIcon;
  label: string;
  count: number;
  countSuffix: string;
  emptyText: string;
  dotColor: string;
  onClick: () => void;
  children?: React.ReactNode;
}

function WidgetCard({ Icon, label, count, countSuffix, emptyText, dotColor, onClick, children }: WidgetCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group"
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'hsl(var(--ds-surface-2))';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'hsl(var(--ds-surface))';
      }}
    >
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid hsl(var(--ds-line-1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
          <span
            style={{
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 500,
              color: 'hsl(var(--ds-fg-2))',
            }}
          >
            {label}
          </span>
        </div>
        <ArrowRight
          size={14}
          strokeWidth={1.5}
          style={{ color: 'hsl(var(--ds-fg-4))' }}
        />
      </div>
      <div style={{ padding: 18 }}>
        <div style={{ marginBottom: 14 }}>
          <span
            style={{
              fontFamily: '"HN Display", sans-serif',
              fontSize: 32,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
              color: 'hsl(var(--ds-fg-1))',
              lineHeight: 1,
            }}
          >
            <CountUp value={count} />
          </span>
          <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>{countSuffix}</p>
        </div>
        <div style={{ height: 1, background: 'hsl(var(--ds-line-1))', marginBottom: 12 }} />
        {children ? (
          children
        ) : (
          <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>{emptyText}</p>
        )}
        {/* dotColor used for inline dots in children list */}
        <span style={{ display: 'none' }} data-dot-color={dotColor} />
      </div>
    </div>
  );
}

export default function TodayWidgets() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { items } = usePostProduction();
  const { tasks } = useTasks();
  const { data: recordingEvents = [], isLoading: recordingsLoading } = useRecordingsToday();

  // Entregas hoje
  const todayDeliveries = items
    .filter(i => i.due_date === today && i.status !== 'entregue')
    .sort((a, b) => PP_PRIORITY_ORDER[b.priority] - PP_PRIORITY_ORDER[a.priority]);

  // Minhas tarefas
  const myTasks = tasks
    .filter(t => t.status !== 'concluida' && t.status !== 'arquivada' && t.assignees?.some(a => a.user_id === user?.id))
    .sort((a, b) => {
      const aToday = a.due_date === today ? 0 : 1;
      const bToday = b.due_date === today ? 0 : 1;
      return aToday - bToday;
    });

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };
  const itemTextStyle: React.CSSProperties = {
    fontSize: 13,
    color: 'hsl(var(--ds-fg-1))',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
  const dot = (color: string): React.CSSProperties => ({
    width: 6,
    height: 6,
    borderRadius: 9999,
    background: color,
    flexShrink: 0,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Entregas hoje */}
      <WidgetCard
        Icon={Film}
        label="Entregas hoje"
        count={todayDeliveries.length}
        countSuffix="vídeo(s) para entregar"
        emptyText="Nenhuma entrega para hoje"
        dotColor="hsl(var(--ds-info))"
        onClick={() => navigate('/esteira-de-pos')}
      >
        {todayDeliveries.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todayDeliveries.slice(0, 3).map(item => (
              <div key={item.id} style={rowStyle}>
                <span style={dot('hsl(var(--ds-info))')} />
                <span style={itemTextStyle}>{item.title}</span>
                <span
                  className={`pill ${PP_PRIORITY_CONFIG[item.priority].color}`}
                  style={{ fontSize: 10, flexShrink: 0 }}
                >
                  {PP_PRIORITY_CONFIG[item.priority].label}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>Nenhuma entrega para hoje</p>
        )}
      </WidgetCard>

      {/* Minhas tarefas */}
      <WidgetCard
        Icon={CheckSquare}
        label="Minhas tarefas"
        count={myTasks.length}
        countSuffix="tarefa(s) pendente(s)"
        emptyText="Nenhuma tarefa pendente"
        dotColor="hsl(var(--ds-warn))"
        onClick={() => navigate('/tarefas')}
      >
        {myTasks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myTasks.slice(0, 3).map(task => (
              <div key={task.id} style={rowStyle}>
                <span style={dot('hsl(var(--ds-warn))')} />
                <span style={itemTextStyle}>{task.title}</span>
                <span
                  className="pill muted"
                  style={{ fontSize: 10, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}
                >
                  {task.due_date === today
                    ? 'hoje'
                    : task.due_date
                      ? format(parseISO(task.due_date), 'dd/MM')
                      : '—'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>Nenhuma tarefa pendente</p>
        )}
      </WidgetCard>

      {/* Gravações do dia */}
      <WidgetCard
        Icon={Video}
        label="Gravações do dia"
        count={recordingEvents.length}
        countSuffix={recordingEvents.length === 1 ? 'gravação agendada' : 'gravações agendadas'}
        emptyText={recordingsLoading ? 'Carregando...' : 'Nenhuma gravação hoje'}
        dotColor="hsl(var(--ds-success))"
        onClick={() => navigate('/retiradas')}
      >
        {recordingEvents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recordingEvents.slice(0, 3).map(e => (
              <div key={e.id} style={rowStyle}>
                <span style={dot('hsl(var(--ds-success))')} />
                <span style={itemTextStyle}>{getEventTitle(e.summary)}</span>
                <span
                  className="pill muted"
                  style={{ fontSize: 10, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}
                >
                  {e.allDay ? 'Dia todo' : new Date(e.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
            {recordingsLoading ? 'Carregando...' : 'Nenhuma gravação hoje'}
          </p>
        )}
      </WidgetCard>
    </div>
  );
}
