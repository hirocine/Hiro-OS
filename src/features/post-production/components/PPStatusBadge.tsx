import { PPStatus, PP_STATUS_CONFIG } from '../types';
import { StatusPill } from '@/ds/components/StatusPill';

type StatusTone =
  | 'success'
  | 'info'
  | 'warning'
  | 'muted'
  | { color: string };

const TONE_BY_STATUS: Record<PPStatus, StatusTone> = {
  entregue: 'success',
  edicao: 'info',
  color_grading: { color: 'hsl(280 70% 60%)' }, // exception — non-DS hue for this pipeline stage
  finalizacao: 'warning',
  revisao: 'warning',
  validacao_cliente: 'info',
  fila: 'muted',
};

const ICON_BY_STATUS: Partial<Record<PPStatus, string>> = {
  entregue: '✓',
};

interface PPStatusBadgeProps {
  status: PPStatus;
}

export function PPStatusBadge({ status }: PPStatusBadgeProps) {
  return (
    <StatusPill
      label={PP_STATUS_CONFIG[status].label}
      tone={TONE_BY_STATUS[status]}
      icon={ICON_BY_STATUS[status]}
      interactive
    />
  );
}
