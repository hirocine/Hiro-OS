import { useNavigate } from 'react-router-dom';
import { Plus, Receipt, CheckCircle, Archive } from 'lucide-react';
import { useProposals, ProposalCard } from '@/features/proposals';
import { EmptyState } from '@/ds/components/EmptyState';
import { CollapsibleSection } from '@/ds/components/CollapsibleSection';
import { PageHeader } from '@/ds/components/toolbar';
import type { Proposal } from '@/features/proposals';

export default function Proposals() {
  const navigate = useNavigate();
  const { data: proposals, deleteProposal, duplicateProposal } = useProposals();

  const activeProposals = (proposals || []).filter(p =>
    p.status === 'draft' || p.status === 'sent' || p.status === 'opened' || p.status === 'new_version'
  );
  const approvedProposals = (proposals || []).filter(p => p.status === 'approved');
  const archivedProposals = (proposals || []).filter(p => p.status === 'expired');

  const renderList = (items: Proposal[]) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((p) => (
        <ProposalCard
          key={p.id}
          proposal={p}
          onDelete={(id) => deleteProposal.mutate(id)}
          onDuplicate={(id) => duplicateProposal.mutate(id)}
        />
      ))}
    </div>
  );

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <PageHeader
          title="Orçamentos."
          subtitle="Gerencie suas propostas comerciais."
          action={
            <button className="btn primary" onClick={() => navigate('/orcamentos/novo')} type="button">
              <Plus size={14} strokeWidth={1.5} />
              <span>Nova Proposta</span>
            </button>
          }
        />

        <CollapsibleSection number="01" title="Orçamentos ativos" count={activeProposals.length}>
          {activeProposals.length > 0 ? (
            renderList(activeProposals)
          ) : (
            <EmptyState
              icon={Receipt}
              title="Nenhum orçamento ativo"
              description="Crie sua primeira proposta comercial."
              variant="bare"
              action={
                <button className="btn primary" onClick={() => navigate('/orcamentos/novo')} type="button">
                  <Plus size={14} strokeWidth={1.5} />
                  <span>Nova proposta</span>
                </button>
              }
            />
          )}
        </CollapsibleSection>

        <CollapsibleSection number="02" title="Aprovados" count={approvedProposals.length} collapsible>
          {approvedProposals.length > 0 ? (
            renderList(approvedProposals)
          ) : (
            <EmptyState
              icon={CheckCircle}
              title="Nenhum orçamento aprovado"
              description="Orçamentos aprovados pelo cliente aparecerão aqui."
              variant="bare"
            />
          )}
        </CollapsibleSection>

        <CollapsibleSection number="03" title="Arquivados" count={archivedProposals.length} collapsible>
          {archivedProposals.length > 0 ? (
            renderList(archivedProposals)
          ) : (
            <EmptyState
              icon={Archive}
              title="Nenhum orçamento arquivado"
              description="Orçamentos expirados serão movidos para cá."
              variant="bare"
            />
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
}
