import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { ProposalWizard } from '@/features/proposals';

export default function NewProposal() {
  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader
        title="Nova Proposta Comercial"
        subtitle="Preencha os dados para gerar a proposta"
      />
      <ProposalWizard />
    </ResponsiveContainer>
  );
}
