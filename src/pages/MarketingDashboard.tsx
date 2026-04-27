import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';

export default function MarketingDashboard() {
  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader title="Dashboard de Marketing" description="KPIs consolidados, evolução e top conteúdos." />
      <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
        Em construção — em breve KPIs, gráficos de evolução e ranking dos melhores posts.
      </div>
    </ResponsiveContainer>
  );
}
