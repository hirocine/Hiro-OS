import { useAuthContext } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Construction } from 'lucide-react';

export default function CashFlow() {
  const { isAdmin } = useAuthContext();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader title="Fluxo de Caixa" />
      <EmptyState
        icon={Construction}
        title="Em desenvolvimento"
        description="A funcionalidade de Fluxo de Caixa está sendo desenvolvida e estará disponível em breve."
      />
    </ResponsiveContainer>
  );
}
