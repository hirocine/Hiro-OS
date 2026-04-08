import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { ContactCard } from '@/features/crm/components/contacts/ContactCard';
import { ActivitiesList } from '@/features/crm/components/activities/ActivitiesList';
import { DealForm } from '@/features/crm/components/pipeline/DealForm';
import { useDeals } from '@/features/crm/hooks/useDeals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, Handshake } from 'lucide-react';
import { formatBRL } from '@/features/crm/types/crm.types';
import { useState } from 'react';
import type { Contact } from '@/features/crm/types/crm.types';

export default function CRMContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dealFormOpen, setDealFormOpen] = useState(false);

  const { data: contact, isLoading } = useQuery<Contact>({
    queryKey: ['crm-contacts', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('crm_contacts').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: deals, isLoading: dealsLoading } = useDeals(id);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-40 w-full" /></div>;
  if (!contact) return <p>Contato não encontrado.</p>;

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[{ label: 'CRM', href: '/crm' }, { label: contact.name }]} />

      <ContactCard contact={contact} />

      {/* Deals section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Handshake className="h-4 w-4" /> Deals Vinculados
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setDealFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Novo Deal
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          {dealsLoading ? (
            <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !deals?.length ? (
            <EmptyState compact icon={Handshake} title="Nenhum deal" description="Crie o primeiro deal para este contato." />
          ) : (
            <div className="space-y-2">
              {deals.map(d => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2" onClick={() => navigate(`/crm/deals/${d.id}`)}>
                  <div>
                    <p className="text-sm font-medium">{d.title}</p>
                    <p className="text-xs text-muted-foreground">{d.stage_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatBRL(d.estimated_value)}</p>
                    <Badge variant="secondary" className="text-xs" style={{ borderColor: d.stage_color }}>{d.stage_name}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activities */}
      <Card>
        <CardContent className="p-4">
          <ActivitiesList contactId={id} />
        </CardContent>
      </Card>

      <DealForm open={dealFormOpen} onOpenChange={setDealFormOpen} defaultContactId={id} />
    </div>
  );
}
