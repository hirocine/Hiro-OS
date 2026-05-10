import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, ChevronDown, ChevronRight, Receipt, CheckCircle, Archive } from 'lucide-react';
import { useProposals, ProposalCard } from '@/features/proposals';
import type { Proposal } from '@/features/proposals';

export default function Proposals() {
  const navigate = useNavigate();
  const { data: proposals, deleteProposal, duplicateProposal } = useProposals();
  const [showApproved, setShowApproved] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const activeProposals = (proposals || []).filter(p => p.status === 'draft' || p.status === 'sent' || p.status === 'opened' || p.status === 'new_version');
  const approvedProposals = (proposals || []).filter(p => p.status === 'approved');
  const archivedProposals = (proposals || []).filter(p => p.status === 'expired');

  const renderList = (items: Proposal[]) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map(p => (
        <ProposalCard
          key={p.id}
          proposal={p}
          onDelete={(id) => deleteProposal.mutate(id)}
          onDuplicate={(id) => duplicateProposal.mutate(id)}
        />
      ))}
    </div>
  );

  const sectionHeader = (eyebrow: string, title: string, count: number) => (
    <div className="section-head">
      <div className="section-head-l">
        <span className="section-eyebrow">{eyebrow}</span>
        <span className="section-title">{title}</span>
      </div>
      <span className="section-meta">{count} {count === 1 ? 'item' : 'itens'}</span>
    </div>
  );

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <div className="ph">
          <div>
            <h1 className="ph-title">Orçamentos.</h1>
            <p className="ph-sub">Gerencie suas propostas comerciais.</p>
          </div>
          <div className="ph-actions">
            <button className="btn primary" onClick={() => navigate('/orcamentos/novo')} type="button">
              <Plus size={14} strokeWidth={1.5} />
              <span>Nova Proposta</span>
            </button>
          </div>
        </div>

        {/* Ativos */}
        <section className="section">
          {sectionHeader('01', 'Orçamentos ativos', activeProposals.length)}
          {activeProposals.length > 0 ? (
            renderList(activeProposals)
          ) : (
            <div className="empties">
              <div className="empty" style={{ borderRight: 0 }}>
                <div className="glyph"><Receipt strokeWidth={1.25} /></div>
                <h5>Nenhum orçamento ativo</h5>
                <p>Crie sua primeira proposta comercial.</p>
                <div className="actions">
                  <button className="btn primary" onClick={() => navigate('/orcamentos/novo')} type="button">
                    <Plus size={14} strokeWidth={1.5} />
                    <span>Nova proposta</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Aprovados */}
        <Collapsible open={showApproved} onOpenChange={setShowApproved}>
          <section className="section">
            <CollapsibleTrigger asChild>
              <div style={{ cursor: 'pointer' }} className="section-head">
                <div className="section-head-l">
                  <span className="section-eyebrow">02</span>
                  <span className="section-title">Aprovados</span>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="section-meta">{approvedProposals.length} {approvedProposals.length === 1 ? 'item' : 'itens'}</span>
                  {showApproved ? <ChevronDown size={14} strokeWidth={1.5} /> : <ChevronRight size={14} strokeWidth={1.5} />}
                </span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {approvedProposals.length > 0 ? (
                renderList(approvedProposals)
              ) : (
                <div className="empties">
                  <div className="empty" style={{ borderRight: 0, padding: '40px 48px', minHeight: 220 }}>
                    <div className="glyph"><CheckCircle strokeWidth={1.25} /></div>
                    <h5>Nenhum orçamento aprovado</h5>
                    <p>Orçamentos aprovados pelo cliente aparecerão aqui.</p>
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </section>
        </Collapsible>

        {/* Arquivados */}
        <Collapsible open={showArchived} onOpenChange={setShowArchived}>
          <section className="section">
            <CollapsibleTrigger asChild>
              <div style={{ cursor: 'pointer' }} className="section-head">
                <div className="section-head-l">
                  <span className="section-eyebrow">03</span>
                  <span className="section-title">Arquivados</span>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="section-meta">{archivedProposals.length} {archivedProposals.length === 1 ? 'item' : 'itens'}</span>
                  {showArchived ? <ChevronDown size={14} strokeWidth={1.5} /> : <ChevronRight size={14} strokeWidth={1.5} />}
                </span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {archivedProposals.length > 0 ? (
                renderList(archivedProposals)
              ) : (
                <div className="empties">
                  <div className="empty" style={{ borderRight: 0, padding: '40px 48px', minHeight: 220 }}>
                    <div className="glyph"><Archive strokeWidth={1.25} /></div>
                    <h5>Nenhum orçamento arquivado</h5>
                    <p>Orçamentos expirados serão movidos para cá.</p>
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </section>
        </Collapsible>
      </div>
    </div>
  );
}
