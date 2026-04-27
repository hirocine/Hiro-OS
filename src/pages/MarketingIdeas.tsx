import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';

export default function MarketingIdeas() {
  return (
    <ResponsiveContainer>
      <PageHeader title="Ideias" subtitle="Banco de ideias de marketing" />
      <div className="text-sm text-muted-foreground">Em construção</div>
    </ResponsiveContainer>
  );
}
