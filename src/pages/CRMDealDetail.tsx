import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { ActivitiesList } from '@/features/crm/components/activities/ActivitiesList';
import { usePipelineStages } from '@/features/crm/hooks/usePipelineStages';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBRL, type Deal } from '@/features/crm/types/crm.types';
import { Clock, FileText } from 'lucide-react';
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

  const { data: proposal } = useQuery({
    queryKey: ['crm-deal-proposal', deal?.proposal_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('project_name, slug, final_value, status')
        .eq('id', deal!.proposal_id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!deal?.proposal_id,
  });

  if (isLoading) return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
  if (!deal) return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner" style={{ textAlign: 'center', padding: '64px 0', color: 'hsl(var(--ds-fg-3))' }}>
        Deal não encontrado.
      </div>
    </div>
  );

  const currentStage = stages?.find(s => s.id === deal.stage_id);
  const daysInStage = differenceInDays(new Date(), new Date(deal.updated_at ?? deal.created_at ?? new Date()));

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <BreadcrumbNav items={[{ label: 'CRM', href: '/crm' }, { label: deal.title }]} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Summary */}
        <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: 'hsl(var(--ds-fg-1))', fontFamily: '"HN Display", sans-serif' }}>
                {deal.title}
              </h2>
              <button
                type="button"
                style={{
                  fontSize: 13,
                  color: 'hsl(var(--ds-accent))',
                  marginTop: 2,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                onClick={() => navigate(`/crm/contatos/${deal.contact_id}`)}
              >
                {deal.contact_name}
              </button>
              {proposal && (
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 13,
                    color: 'hsl(var(--ds-accent))',
                    marginTop: 4,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                  onClick={() => navigate(`/orcamentos/${proposal.slug}`)}
                >
                  <FileText size={14} strokeWidth={1.5} />
                  Proposta: {proposal.project_name}
                </button>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: 24, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--ds-fg-1))', fontFamily: '"HN Display", sans-serif' }}>
                {formatBRL(deal.estimated_value)}
              </p>
              {currentStage && (
                <span
                  className="pill"
                  style={{
                    marginTop: 4,
                    backgroundColor: currentStage.color ?? '#6366f1',
                    color: '#fff',
                    borderColor: currentStage.color ?? '#6366f1',
                  }}
                >
                  {currentStage.name}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
            {deal.service_type && <span>Tipo: {deal.service_type}</span>}
            {deal.expected_close_date && (
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                Previsão: {new Date(deal.expected_close_date).toLocaleDateString('pt-BR')}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={14} strokeWidth={1.5} />
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {daysInStage} {daysInStage === 1 ? 'dia' : 'dias'} no stage
              </span>
            </span>
          </div>

          {deal.description && (
            <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', borderTop: '1px solid hsl(var(--ds-line-1))', paddingTop: 12 }}>
              {deal.description}
            </p>
          )}
          {deal.lost_reason && (
            <p style={{ fontSize: 13, borderTop: '1px solid hsl(var(--ds-line-1))', paddingTop: 12, color: 'hsl(var(--ds-fg-1))' }}>
              <span style={{ color: 'hsl(var(--ds-fg-3))' }}>Motivo da perda:</span> {deal.lost_reason}
            </p>
          )}
        </div>

        {/* Pipeline stepper */}
        {stages && stages.length > 0 && (
          <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid hsl(var(--ds-line-1))', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'hsl(var(--ds-fg-2))' }}>
                Pipeline
              </span>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingTop: 8, paddingBottom: 8 }}>
                {stages.map((stage, i) => {
                  const stageIdx = stages.findIndex(s => s.id === deal.stage_id);
                  const isCurrent = stage.id === deal.stage_id;
                  const isPast = i < stageIdx;
                  const color = stage.color ?? '#6366f1';

                  return (
                    <div key={stage.id} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      {i > 0 && (
                        <div
                          style={{
                            height: 2,
                            width: 32,
                            backgroundColor: isPast || isCurrent ? color : 'hsl(var(--ds-line-1))',
                          }}
                        />
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div
                          style={{
                            height: 20,
                            width: 20,
                            borderRadius: '50%',
                            border: '2px solid',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isPast || isCurrent ? color : 'transparent',
                            borderColor: color,
                            boxShadow: isCurrent ? `0 0 0 3px ${color}33` : undefined,
                          }}
                        >
                          {(isPast || isCurrent) && (
                            <div style={{ height: 8, width: 8, borderRadius: '50%', background: 'white' }} />
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            color: 'hsl(var(--ds-fg-3))',
                            whiteSpace: 'nowrap',
                            maxWidth: 70,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {stage.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Activities */}
        <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))', padding: 18 }}>
          <ActivitiesList dealId={id} />
        </div>
      </div>
      </div>
    </div>
  );
}
