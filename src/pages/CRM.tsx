import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { CRMLayout } from '@/features/crm/components/CRMLayout';

export default function CRM() {
  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader
        title="CRM"
        subtitle="Gerencie seu pipeline e contatos comerciais"
      />
      <CRMLayout />
    </ResponsiveContainer>
  );
}
