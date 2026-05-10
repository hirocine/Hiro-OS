import { Navigate } from 'react-router-dom';
import {
  Landmark, TrendingDown, ArrowDownRight, Camera, Monitor, Building2, CalendarPlus, BarChart3, Layers,
  type LucideIcon,
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCapexData } from '@/hooks/useCapexData';
import { formatCurrency } from '@/lib/utils';

type Tone = 'fg' | 'accent' | 'destructive' | 'success' | 'muted';

const toneColor: Record<Tone, string> = {
  fg: 'hsl(var(--ds-fg-1))',
  accent: 'hsl(var(--ds-accent))',
  destructive: 'hsl(var(--ds-danger))',
  success: 'hsl(var(--ds-success))',
  muted: 'hsl(var(--ds-fg-3))',
};

function CapexTile({
  title, Icon, value, subtitle, tone = 'fg', loading,
}: {
  title: string;
  Icon: LucideIcon;
  value: string;
  subtitle?: string;
  tone?: Tone;
  loading?: boolean;
}) {
  const color = toneColor[tone];
  return (
    <div
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        background: 'hsl(var(--ds-surface))',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'hsl(var(--ds-fg-3))' }}>
        <Icon size={14} strokeWidth={1.5} style={{ color }} />
        <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500 }}>
          {title}
        </span>
      </div>
      <div
        style={{
          fontFamily: '"HN Display", sans-serif',
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          fontVariantNumeric: 'tabular-nums',
          color,
        }}
      >
        {loading ? '—' : value}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', lineHeight: 1.4 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function SectionHead({ eyebrow, title, Icon }: { eyebrow: string; title: string; Icon: LucideIcon }) {
  return (
    <div className="section-head">
      <div className="section-head-l">
        <span className="section-eyebrow">{eyebrow}</span>
        <span className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Icon size={14} strokeWidth={1.5} />
          {title}
        </span>
      </div>
    </div>
  );
}

export default function Capex() {
  const { isAdmin, roleLoading } = useAuthContext();
  const { data, loading } = useCapexData();

  if (!roleLoading && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const isLoading = roleLoading || loading;

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <div className="ph">
          <div>
            <h1 className="ph-title">Gestão de CAPEX.</h1>
            <p className="ph-sub">Visão patrimonial e investimentos em ativos fixos.</p>
          </div>
        </div>

        {/* Resumo Contábil */}
        <section className="section">
          <SectionHead eyebrow="01" title="Resumo Contábil" Icon={BarChart3} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <CapexTile
              title="Total Investido"
              Icon={Landmark}
              value={formatCurrency(data.total_invested)}
              subtitle="Valor bruto acumulado de compras"
              tone="fg"
              loading={isLoading}
            />
            <CapexTile
              title="Patrimônio Atual"
              Icon={TrendingDown}
              value={formatCurrency(data.total_current)}
              subtitle="Valor líquido (Investido − Depreciação)"
              tone="accent"
              loading={isLoading}
            />
            <CapexTile
              title="Depreciação Mensal"
              Icon={ArrowDownRight}
              value={formatCurrency(data.monthly_depreciation)}
              subtitle="Custo mensal de desvalorização"
              tone="destructive"
              loading={isLoading}
            />
          </div>
        </section>

        {/* Segmentação Estratégica */}
        <section className="section">
          <SectionHead eyebrow="02" title="Segmentação Estratégica" Icon={Layers} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <CapexTile
              title="Equipamentos AV"
              Icon={Camera}
              value={formatCurrency(data.av_equipment)}
              subtitle="Câmeras, lentes e luz"
              tone="accent"
              loading={isLoading}
            />
            <CapexTile
              title="Tecnologia & Post"
              Icon={Monitor}
              value={formatCurrency(data.tech_post)}
              subtitle="Ilhas de edição e armazenamento"
              tone="accent"
              loading={isLoading}
            />
            <CapexTile
              title="Imobilizado Geral"
              Icon={Building2}
              value={formatCurrency(data.general_assets)}
              subtitle="Móveis, infraestrutura e outros"
              tone="muted"
              loading={isLoading}
            />
            <CapexTile
              title="CAPEX 2026"
              Icon={CalendarPlus}
              value={formatCurrency(data.capex_current_year)}
              subtitle="Total investido no ano corrente"
              tone="success"
              loading={isLoading}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
