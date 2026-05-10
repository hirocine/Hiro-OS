import { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useActivities } from '../../hooks/useActivities';
import { ActivityItem } from './ActivityItem';
import { ActivityForm } from './ActivityForm';
import { Plus, Activity } from 'lucide-react';

interface ActivitiesListProps {
  contactId?: string;
  dealId?: string;
}

type Tab = 'pendentes' | 'historico';

export function ActivitiesList({ contactId, dealId }: ActivitiesListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('pendentes');
  const { data: pending, isLoading: loadingPending } = useActivities({ contactId, dealId, pending: true });
  const { data: completed, isLoading: loadingCompleted } = useActivities({ contactId, dealId, pending: false });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span
          style={{
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 500,
            color: 'hsl(var(--ds-fg-3))',
          }}
        >
          Atividades
        </span>
        <button type="button" className="btn" onClick={() => setFormOpen(true)}>
          <Plus size={14} strokeWidth={1.5} />
          <span>Nova Atividade</span>
        </button>
      </div>

      <div className="tabs-bar">
        <button
          type="button"
          onClick={() => setTab('pendentes')}
          className={'tab' + (tab === 'pendentes' ? ' on' : '')}
        >
          Pendentes ({pending?.length ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setTab('historico')}
          className={'tab' + (tab === 'historico' ? ' on' : '')}
        >
          Histórico ({completed?.length ?? 0})
        </button>
      </div>

      <Tabs value={tab}>
        <TabsContent value="pendentes">
          {loadingPending ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className="sk line lg" style={{ height: 40, width: '100%' }} />
              ))}
            </div>
          ) : !pending?.length ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'hsl(var(--ds-fg-3))', fontSize: 12 }}>
              <Activity size={28} strokeWidth={1.25} style={{ margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-2))', marginBottom: 4 }}>
                Nenhuma atividade pendente
              </div>
              <div>Tudo em dia!</div>
            </div>
          ) : (
            <div>{pending.map((a) => <ActivityItem key={a.id} activity={a} />)}</div>
          )}
        </TabsContent>
        <TabsContent value="historico">
          {loadingCompleted ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className="sk line lg" style={{ height: 40, width: '100%' }} />
              ))}
            </div>
          ) : !completed?.length ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'hsl(var(--ds-fg-3))', fontSize: 12 }}>
              <Activity size={28} strokeWidth={1.25} style={{ margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-2))' }}>Nenhuma atividade concluída</div>
            </div>
          ) : (
            <div>{completed.map((a) => <ActivityItem key={a.id} activity={a} />)}</div>
          )}
        </TabsContent>
      </Tabs>

      <ActivityForm open={formOpen} onOpenChange={setFormOpen} contactId={contactId} dealId={dealId} />
    </div>
  );
}
