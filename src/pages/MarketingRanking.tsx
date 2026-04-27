import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';

export default function MarketingRanking() {
  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader title="Ranking de Conteúdos" description="Tabela ordenável de todos os posts publicados." />
      <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
        Em construção — em breve tabela com filtros e sorting por qualquer métrica.
      </div>
    </ResponsiveContainer>
  );
}
