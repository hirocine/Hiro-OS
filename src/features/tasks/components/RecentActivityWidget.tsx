import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRecentActivity } from '../hooks/useRecentActivity';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const cardWrap: React.CSSProperties = {
  border: '1px solid hsl(var(--ds-line-1))',
  background: 'hsl(var(--ds-surface))',
  height: '100%',
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

const getActionText = (action: string, fieldChanged?: string | null) => {
  if (action === 'created') return 'criou';
  if (action === 'status_changed') return 'atualizou o status de';
  if (action === 'priority_changed') return 'atualizou a prioridade de';
  if (action === 'assigned') return 'atribuiu';
  if (action === 'comment_added') return 'comentou em';
  if (action === 'subtask_added') return 'adicionou subtarefa em';
  if (action === 'subtask_completed') return 'concluiu subtarefa em';
  if (fieldChanged) return `atualizou ${fieldChanged} de`;
  return 'atualizou';
};

export function RecentActivityWidget() {
  const navigate = useNavigate();
  const { data: activities, isLoading } = useRecentActivity(8);

  return (
    <div style={cardWrap}>
      <div style={cardHeader}>
        <div
          style={{
            width: 28,
            height: 28,
            display: 'grid',
            placeItems: 'center',
            background: 'hsl(280 70% 60% / 0.15)',
            color: 'hsl(280 70% 60%)',
          }}
        >
          <Activity size={14} strokeWidth={1.5} />
        </div>
        <span style={cardTitle}>Atividade Recente</span>
      </div>
      <div style={{ padding: 14 }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : !activities || activities.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: 'hsl(var(--ds-fg-3))',
              fontSize: 12,
            }}
          >
            <Activity size={24} strokeWidth={1.25} style={{ margin: '0 auto 8px', display: 'block', color: 'hsl(var(--ds-fg-4))' }} />
            Nenhuma atividade recente.
          </div>
        ) : (
          <ScrollArea className="h-[260px] pr-2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: 8,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onClick={() => navigate(`/tarefas/${activity.task_id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Avatar style={{ width: 28, height: 28, flexShrink: 0 }}>
                    <AvatarFallback style={{ fontSize: 11 }}>
                      {activity.user_name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-1))', lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 500 }}>{activity.user_name?.split(' ')[0]}</span>
                      {' '}
                      {getActionText(activity.action, activity.field_changed)}
                      {' '}
                      <span style={{ color: 'hsl(var(--ds-accent))', fontWeight: 500 }}>
"{activity.task_title}"
                      </span>
                    </p>
                    <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}>
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
