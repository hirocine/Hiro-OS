import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { PlatformAccessGrid } from '@/features/platform-accesses';

export default function PlatformAccesses() {
  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader
        title="Acessos de Plataformas"
        subtitle="Gerencie senhas e credenciais de forma segura com criptografia"
      />
      <PlatformAccessGrid />
    </ResponsiveContainer>
  );
}
