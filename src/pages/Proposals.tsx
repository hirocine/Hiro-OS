import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, FileText, Clock, CheckCircle, Archive, ChevronDown, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { useProposals, ProposalCard } from '@/features/proposals';

export default function Proposals() {
  const navigate = useNavigate();
  const { data: proposals, isLoading, deleteProposal } = useProposals();
  const [showApproved, setShowApproved] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const activeProposals = (proposals || []).filter(p => p.status === 'draft' || p.status === 'sent');
  const approvedProposals = (proposals || []).filter(p => p.status === 'approved');
  const archivedProposals = (proposals || []).filter(p => p.status === 'expired');

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

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Proposals */}
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
              {activeProposals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {activeProposals.map(p => (
                    <ProposalCard key={p.id} proposal={p} onDelete={(id) => deleteProposal.mutate(id)} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum orçamento ativo</p>
              )}
            </CardContent>
          </Card>

          {/* Approved Proposals - Collapsible */}
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
                    {showApproved ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {approvedProposals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                      {approvedProposals.map(p => (
                        <ProposalCard key={p.id} proposal={p} onDelete={(id) => deleteProposal.mutate(id)} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">Nenhum orçamento aprovado</p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Archived Proposals - Collapsible */}
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
                    {showArchived ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {archivedProposals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                      {archivedProposals.map(p => (
                        <ProposalCard key={p.id} proposal={p} onDelete={(id) => deleteProposal.mutate(id)} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">Nenhum orçamento arquivado</p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      )}
    </ResponsiveContainer>
  );
}
