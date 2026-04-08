import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { ActivitiesList } from '@/features/crm/components/activities/ActivitiesList';
import { usePipelineStages } from '@/features/crm/hooks/usePipelineStages';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBRL, type Deal } from '@/features/crm/types/crm.types';
import { Activity, Clock } from 'lucide-react';
import { differenceInDays } from 'date-fns';

export default function CRMDealDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: stages } = usePipelineStages();

  const { data: deal, isLoading } = useQuery<Deal & { contact_name?: string }>({
    queryKey: ['crm-deals', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('crm_deals').select('*').eq('id', id!).single();
      if (error) throw error;
      const { data: contact } = await supabase.from('crm_contacts').select('name').eq('id', data.contact_id).single();
      return { ...data, contact_name: contact?.name ?? 'Desconhecido' };
    },
    enabled: !!id,
  });

  if (isLoading) return (
    <ResponsiveContainer maxWidth="7xl">
      <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-40 w-full" /></div>
    </ResponsiveContainer>
  );
  if (!deal) return <p>Deal não encontrado.</p>;

  const currentStage = stages?.find(s => s.id === deal.stage_id);
  const daysInStage = differenceInDays(new Date(), new Date(deal.updated_at ?? deal.created_at ?? new Date()));

  return (
    <ResponsiveContainer maxWidth="7xl">
      <BreadcrumbNav items={[{ label: 'CRM', href: '/crm' }, { label: deal.title }]} />

      {/* Summary Card */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{deal.title}</h2>
              <button
                type="button"
                className="text-sm text-primary hover:underline mt-0.5"
                onClick={() => navigate(`/crm/contatos/${deal.contact_id}`)}
              >
                {deal.contact_name}
              </button>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-semibold">{formatBRL(deal.estimated_value)}</p>
              {currentStage && (
                <Badge className="mt-1" style={{ backgroundColor: currentStage.color ?? '#6366f1', color: '#fff' }}>
                  {currentStage.name}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {deal.service_type && <span>Tipo: {deal.service_type}</span>}
            {deal.expected_close_date && <span>Previsão: {new Date(deal.expected_close_date).toLocaleDateString('pt-BR')}</span>}
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {daysInStage} {daysInStage === 1 ? 'dia' : 'dias'} no stage
            </span>
          </div>

          {deal.description && <p className="text-sm text-muted-foreground border-t pt-3">{deal.description}</p>}
          {deal.lost_reason && <p className="text-sm border-t pt-3"><span className="text-muted-foreground">Motivo da perda:</span> {deal.lost_reason}</p>}
        </CardContent>
      </Card>

      {/* Pipeline stepper */}
      {stages && stages.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                Pipeline
              </div>
            </div>
            <div className="flex items-center gap-0 overflow-x-auto py-2">
              {stages.map((stage, i) => {
                const stageIdx = stages.findIndex(s => s.id === deal.stage_id);
                const isCurrent = stage.id === deal.stage_id;
                const isPast = i < stageIdx;
                const color = stage.color ?? '#6366f1';

                return (
                  <div key={stage.id} className="flex items-center flex-shrink-0">
                    {i > 0 && (
                      <div
                        className="h-0.5 w-8"
                        style={{ backgroundColor: isPast || isCurrent ? color : 'hsl(var(--muted))' }}
                      />
                    )}
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="h-5 w-5 rounded-full border-2 flex items-center justify-center"
                        style={{
                          backgroundColor: isPast || isCurrent ? color : 'transparent',
                          borderColor: color,
                          boxShadow: isCurrent ? `0 0 0 3px ${color}33` : undefined,
                        }}
                      >
                        {(isPast || isCurrent) && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap max-w-[70px] truncate">
                        {stage.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activities */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Activity className="h-4 w-4" />
              Atividades
            </div>
          </div>
          <ActivitiesList dealId={id} />
        </CardContent>
      </Card>
    </ResponsiveContainer>
  );
}
