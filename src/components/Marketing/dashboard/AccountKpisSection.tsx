import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, BarChart3, Eye, FileText, RefreshCw } from 'lucide-react';
import { AccountKpiCard } from './AccountKpiCard';

interface LatestAccount {
  followers_count?: number | null;
  media_count?: number | null;
}

interface AccountKpis {
  followersDeltaPeriod: number;
  reachPeriod: number;
  reachChange: number | null;
  profileViewsPeriod: number;
  profileViewsChange: number | null;
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (accountSnapshotsLength === 0 && !accountLoading) {
    return (
      <Card>
        <CardContent className="py-10">
          <EmptyState
            icon={RefreshCw}
            title="Aguardando primeira sincronização"
            description="Clique em 'Sincronizar agora' para puxar os dados atuais da conta Instagram."
            action={{ label: 'Sincronizar agora', onClick: onSync }}
          />
        </CardContent>
      </Card>
    );
  }

  if (accountSnapshotsLength === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
        icon={Eye}
        label="Visitas no perfil"
        value={(accountKpis?.profileViewsPeriod ?? 0).toLocaleString('pt-BR')}
        subtitle={
          accountKpis?.profileViewsChange !== null &&
          accountKpis?.profileViewsChange !== undefined
            ? `${accountKpis.profileViewsChange >= 0 ? '+' : ''}${accountKpis.profileViewsChange.toFixed(1)}% vs período anterior`
            : 'sem comparação'
        }
        subtone={
          accountKpis?.profileViewsChange !== null &&
          accountKpis?.profileViewsChange !== undefined
            ? accountKpis.profileViewsChange >= 0
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
