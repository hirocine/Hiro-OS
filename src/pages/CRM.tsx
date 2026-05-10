import { useLocation } from 'react-router-dom';
import { CRMLayout } from '@/features/crm/components/CRMLayout';

const TAB_HEADERS: Record<string, { title: string; subtitle: string }> = {
  pipeline:   { title: 'Pipeline',  subtitle: 'Acompanhe os deals por estágio do funil.' },
  contatos:   { title: 'Contatos',  subtitle: 'Base de leads, clientes e parceiros comerciais.' },
  atividades: { title: 'Atividades', subtitle: 'Histórico e próximos passos com cada contato.' },
  dashboard:  { title: 'Dashboard', subtitle: 'Visão consolidada da saúde comercial.' },
};

export default function CRM() {
  const location = useLocation();
  const segment = location.pathname.split('/')[2] || 'pipeline';
  const header = TAB_HEADERS[segment] || TAB_HEADERS.pipeline;

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <div className="ph">
          <div>
            <h1 className="ph-title">{header.title}.</h1>
            <p className="ph-sub">{header.subtitle}</p>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <CRMLayout />
        </div>
      </div>
    </div>
  );
}
