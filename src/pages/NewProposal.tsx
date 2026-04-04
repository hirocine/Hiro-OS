import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { ProposalGuidedWizard } from '@/features/proposals';

export default function NewProposal() {
  return (
    <ResponsiveContainer maxWidth="7xl">
      <ProposalGuidedWizard />
    </ResponsiveContainer>
  );
}
