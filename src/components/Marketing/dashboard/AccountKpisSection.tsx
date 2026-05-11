import { Users, BarChart3, FileText, RefreshCw } from 'lucide-react';
import { AccountKpiCard } from './AccountKpiCard';
import { EmptyState } from '@/ds/components/EmptyState';

interface LatestAccount {
  followers_count?: number | null;
  media_count?: number | null;
}

interface AccountKpis {
  followersDeltaPeriod: number;
  reachPeriod: number;
  reachChange: number | null;
  newPostsPeriod: number;
}

interface Props {
  accountSnapshotsLength: number;
  accountLoading: boolean;
  latestAccount: LatestAccount | null | undefined;
  accountKpis: AccountKpis | null;
  onSync: () => void;
}

export function AccountKpisSection({
  accountSnapshotsLength,
  accountLoading,
  latestAccount,
  accountKpis,
  onSync,
}: Props) {
  if (accountLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              border: '1px solid hsl(var(--ds-line-1))',
              background: 'hsl(var(--ds-surface))',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              minHeight: 110,
            }}
          >
            <span className="sk line" style={{ width: '40%' }} />
            <span className="sk line lg" style={{ width: '50%' }} />
            <span className="sk line" style={{ width: '60%' }} />
          </div>
        ))}
      </div>
    );
  }

  if (accountSnapshotsLength === 0 && !accountLoading) {
    return (
      <EmptyState
        icon={RefreshCw}
        title="Aguardando primeira sincronização"
        description="Clique em 'Sincronizar agora' para puxar os dados atuais da conta Instagram."
        action={
          <button className="btn primary" onClick={onSync} type="button">
            <RefreshCw size={14} strokeWidth={1.5} />
            <span>Sincronizar agora</span>
          </button>
        }
      />
    );
  }

  if (accountSnapshotsLength === 0) {
    return null;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      <AccountKpiCard
        icon={Users}
        label="Seguidores"
        value={(latestAccount?.followers_count ?? 0).toLocaleString('pt-BR')}
        subtitle={
          accountKpis
            ? `${accountKpis.followersDeltaPeriod >= 0 ? '+' : ''}${accountKpis.followersDeltaPeriod} no período`
            : undefined
        }
        subtone={
          accountKpis
            ? accountKpis.followersDeltaPeriod >= 0
              ? 'positive'
              : 'negative'
            : 'muted'
        }
      />
      <AccountKpiCard
        icon={BarChart3}
        label="Alcance no período"
        value={(accountKpis?.reachPeriod ?? 0).toLocaleString('pt-BR')}
        subtitle={
          accountKpis?.reachChange !== null && accountKpis?.reachChange !== undefined
            ? `${accountKpis.reachChange >= 0 ? '+' : ''}${accountKpis.reachChange.toFixed(1)}% vs período anterior`
            : 'sem comparação'
        }
        subtone={
          accountKpis?.reachChange !== null && accountKpis?.reachChange !== undefined
            ? accountKpis.reachChange >= 0
              ? 'positive'
              : 'negative'
            : 'muted'
        }
      />
      <AccountKpiCard
        icon={FileText}
        label="Posts publicados"
        value={(latestAccount?.media_count ?? 0).toLocaleString('pt-BR')}
        subtitle={
          accountKpis && accountKpis.newPostsPeriod > 0
            ? `+${accountKpis.newPostsPeriod} no período`
            : 'total acumulado'
        }
        subtone="muted"
      />
    </div>
  );
}
