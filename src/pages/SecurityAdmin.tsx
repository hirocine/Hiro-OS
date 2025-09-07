import { SecurityDashboard } from '@/components/Security/SecurityDashboard';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';

export default function SecurityAdmin() {
  return (
    <ResponsiveContainer maxWidth="6xl">
      <PageHeader 
        title="Segurança" 
        subtitle="Dashboard de segurança e monitoramento do sistema"
      />
      <SecurityDashboard />
    </ResponsiveContainer>
  );
}