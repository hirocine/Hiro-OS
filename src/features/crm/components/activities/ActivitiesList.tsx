import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useActivities } from '../../hooks/useActivities';
import { ActivityItem } from './ActivityItem';
import { ActivityForm } from './ActivityForm';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Activity } from 'lucide-react';

interface ActivitiesListProps {
  contactId?: string;
  dealId?: string;
}

export function ActivitiesList({ contactId, dealId }: ActivitiesListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const { data: pending, isLoading: loadingPending } = useActivities({ contactId, dealId, pending: true });
  const { data: completed, isLoading: loadingCompleted } = useActivities({ contactId, dealId, pending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Atividades</h3>
        <Button size="sm" variant="outline" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nova Atividade
        </Button>
      </div>

      <Tabs defaultValue="pendentes">
        <TabsList>
          <TabsTrigger value="pendentes">Pendentes ({pending?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="historico">Histórico ({completed?.length ?? 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="pendentes" className="mt-4">
          {loadingPending ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !pending?.length ? (
            <EmptyState compact icon={Activity} title="Nenhuma atividade pendente" description="Tudo em dia!" />
          ) : (
            pending.map(a => <ActivityItem key={a.id} activity={a} />)
          )}
        </TabsContent>
        <TabsContent value="historico" className="mt-4">
          {loadingCompleted ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !completed?.length ? (
            <EmptyState compact icon={Activity} title="Nenhuma atividade concluída" description="" />
          ) : (
            completed.map(a => <ActivityItem key={a.id} activity={a} />)
          )}
        </TabsContent>
      </Tabs>

      <ActivityForm open={formOpen} onOpenChange={setFormOpen} contactId={contactId} dealId={dealId} />
    </div>
  );
}
