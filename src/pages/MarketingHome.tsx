import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';

export default function MarketingHome() {
  return (
    <ResponsiveContainer>
      <PageHeader title="Marketing" subtitle="Visão geral do módulo de Marketing" />
      <div className="text-sm text-muted-foreground">Em construção</div>
    </ResponsiveContainer>
  );
}
