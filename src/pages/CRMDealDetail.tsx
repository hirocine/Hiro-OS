import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { ActivitiesList } from '@/features/crm/components/activities/ActivitiesList';
import { usePipelineStages } from '@/features/crm/hooks/usePipelineStages';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBRL, type Deal } from '@/features/crm/types/crm.types';
import { cn } from '@/lib/utils';

export default function CRMDealDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: stages } = usePipelineStages();

  const { data: deal, isLoading } = useQuery<Deal & { contact_name?: string }>({
    queryKey: ['crm-deals', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('crm_deals').select('*').eq('id', id!).single();
      if (error) throw error;
      // Get contact name
      const { data: contact } = await supabase.from('crm_contacts').select('name').eq('id', data.contact_id).single();
      return { ...data, contact_name: contact?.name ?? 'Desconhecido' };
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-40 w-full" /></div>;
  if (!deal) return <p>Deal não encontrado.</p>;

  const currentStage = stages?.find(s => s.id === deal.stage_id);

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[{ label: 'CRM', href: '/crm' }, { label: deal.title }]} />

      {/* Deal summary */}
      <Card>
        <CardHeader className="border-b pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{deal.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{deal.contact_name}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold">{formatBRL(deal.estimated_value)}</p>
              {currentStage && (
                <Badge className="mt-1" style={{ backgroundColor: currentStage.color ?? '#6366f1', color: '#fff' }}>
                  {currentStage.name}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3 text-sm">
          {deal.service_type && <p><span className="text-muted-foreground">Tipo de serviço:</span> {deal.service_type}</p>}
          {deal.expected_close_date && <p><span className="text-muted-foreground">Previsão de fechamento:</span> {new Date(deal.expected_close_date).toLocaleDateString('pt-BR')}</p>}
          {deal.description && <p className="text-muted-foreground">{deal.description}</p>}
          {deal.lost_reason && <p><span className="text-muted-foreground">Motivo da perda:</span> {deal.lost_reason}</p>}
        </CardContent>
      </Card>

      {/* Pipeline stepper */}
      {stages && stages.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {stages.map((stage, i) => {
            const isCurrent = stage.id === deal.stage_id;
            const stageIdx = stages.findIndex(s => s.id === deal.stage_id);
            const isPast = i < stageIdx;
            return (
              <div key={stage.id} className={cn(
                'flex-1 min-w-[80px] py-2 px-3 rounded text-center text-xs font-medium transition-all',
                isCurrent && 'text-white shadow-sm',
                isPast && 'bg-muted text-foreground',
                !isCurrent && !isPast && 'bg-muted/50 text-muted-foreground',
              )} style={isCurrent ? { backgroundColor: stage.color ?? '#6366f1' } : undefined}>
                {stage.name}
              </div>
            );
          })}
        </div>
      )}

      {/* Activities */}
      <Card>
        <CardContent className="p-4">
          <ActivitiesList dealId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
