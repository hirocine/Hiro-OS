import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { useProposals, ProposalCard } from '@/features/proposals';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'sent', label: 'Enviadas' },
  { value: 'approved', label: 'Aprovadas' },
  { value: 'expired', label: 'Expiradas' },
];

export default function Proposals() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('all');
  const { data: proposals, isLoading, deleteProposal } = useProposals(status);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orçamentos"
        subtitle="Gerencie suas propostas comerciais"
        actions={
          <Button onClick={() => navigate('/orcamentos/novo')}>
            <Plus className="h-4 w-4 mr-2" /> Nova Proposta
          </Button>
        }
      />

      {/* Status Filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map(opt => (
          <Button
            key={opt.value}
            variant={status === opt.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatus(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : proposals && proposals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {proposals.map(p => (
            <ProposalCard
              key={p.id}
              proposal={p}
              onDelete={(id) => deleteProposal.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-3">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-muted-foreground">Nenhuma proposta encontrada</p>
          <Button variant="outline" onClick={() => navigate('/orcamentos/novo')}>
            <Plus className="h-4 w-4 mr-2" /> Criar Primeira Proposta
          </Button>
        </div>
      )}
    </div>
  );
}
