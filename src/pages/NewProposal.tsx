import { PageHeader } from '@/components/ui/page-header';
import { ProposalWizard } from '@/features/proposals';

export default function NewProposal() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Proposta Comercial"
        subtitle="Preencha os dados para gerar a proposta"
      />
      <ProposalWizard />
    </div>
  );
}
