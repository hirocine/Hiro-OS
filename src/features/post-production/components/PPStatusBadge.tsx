import { PPStatus, PP_STATUS_CONFIG } from '../types';

const toneFor = (status: PPStatus): React.CSSProperties => {
  switch (status) {
    case 'entregue':         return { color: 'hsl(var(--ds-success))', borderColor: 'hsl(var(--ds-success) / 0.3)' };
    case 'edicao':           return { color: 'hsl(var(--ds-info))',    borderColor: 'hsl(var(--ds-info) / 0.3)' };
    case 'color_grading':    return { color: 'hsl(280 70% 60%)',       borderColor: 'hsl(280 70% 60% / 0.3)' };
    case 'finalizacao':      return { color: 'hsl(var(--ds-warning))', borderColor: 'hsl(var(--ds-warning) / 0.3)' };
    case 'revisao':          return { color: 'hsl(var(--ds-warning))', borderColor: 'hsl(var(--ds-warning) / 0.3)' };
    case 'validacao_cliente':return { color: 'hsl(var(--ds-info))',    borderColor: 'hsl(var(--ds-info) / 0.3)' };
    case 'fila':
    default:                 return { color: 'hsl(var(--ds-fg-3))' };
  }
};

interface PPStatusBadgeProps {
  status: PPStatus;
}

export function PPStatusBadge({ status }: PPStatusBadgeProps) {
  const config = PP_STATUS_CONFIG[status];
  return (
    <span
      className="pill"
      style={{
        ...toneFor(status),
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  );
}
