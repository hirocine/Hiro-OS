import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Clock, CheckCircle, Archive, ChevronDown, ChevronRight, Receipt } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { useProposals, ProposalCard } from '@/features/proposals';
import type { Proposal } from '@/features/proposals';

export default function Proposals() {
  const navigate = useNavigate();
  const { data: proposals, deleteProposal } = useProposals();
  const [showApproved, setShowApproved] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const activeProposals = (proposals || []).filter(p => p.status === 'draft' || p.status === 'sent' || p.status === 'opened' || p.status === 'new_version');
  const approvedProposals = (proposals || []).filter(p => p.status === 'approved');
  const archivedProposals = (proposals || []).filter(p => p.status === 'expired');

  const renderList = (items: Proposal[]) => (
    <div className="flex flex-col gap-3">
      {items.map(p => (
        <ProposalCard
          key={p.id}
          proposal={p}
          onDelete={(id) => deleteProposal.mutate(id)}
        />
      ))}
    </div>
  );

  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader
        title="Orçamentos"
        subtitle="Gerencie suas propostas comerciais"
        actions={
          <Button onClick={() => navigate('/orcamentos/novo')}>
            <Plus className="h-4 w-4 mr-2" /> Nova Proposta
          </Button>
        }
      />
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-lg">
                Orçamentos Ativos ({activeProposals.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {activeProposals.length > 0 ? renderList(activeProposals) : (
              <EmptyState icon={Receipt} title="Nenhum orçamento ativo" description="Crie sua primeira proposta comercial" action={{ label: "Nova Proposta", onClick: () => navigate('/orcamentos/novo') }} />
            )}
          </CardContent>
        </Card>

        <Collapsible open={showApproved} onOpenChange={setShowApproved}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="py-4 cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-success/10">
                      <CheckCircle className="h-4 w-4 text-success" />
                    </div>
                    <CardTitle className="text-lg">
                      Aprovados ({approvedProposals.length})
                    </CardTitle>
                  </div>
                  {showApproved ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                {approvedProposals.length > 0 ? renderList(approvedProposals) : (
                  <EmptyState icon={CheckCircle} title="Nenhum orçamento aprovado" description="Orçamentos aprovados pelo cliente aparecerão aqui" />
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Collapsible open={showArchived} onOpenChange={setShowArchived}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="py-4 cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-muted">
                      <Archive className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-lg">
                      Arquivados ({archivedProposals.length})
                    </CardTitle>
                  </div>
                  {showArchived ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                {archivedProposals.length > 0 ? renderList(archivedProposals) : (
                  <EmptyState icon={Archive} title="Nenhum orçamento arquivado" description="Orçamentos expirados serão movidos para cá" />
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </ResponsiveContainer>
  );
}
